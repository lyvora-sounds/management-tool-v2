import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  authenticateOAuthClient, oauthConfig, oauthHash, parseAuthorizationRequest, verifyPkce,
  authorizationCallback,
} from "@/lib/mcp/oauthConfig";

const findGrant = vi.fn();
const updateGrant = vi.fn();
const createCredential = vi.fn();
const boardAdmin = vi.fn();
const organizationManager = vi.fn();
const findBoard = vi.fn();
vi.mock("@/lib/db", () => ({ default: {
  $transaction: (callback: (tx: unknown) => unknown) => callback({ mcpOAuthGrant: { findUnique: findGrant, updateMany: updateGrant } }),
  externalAccessToken: { create: (...args: unknown[]) => createCredential(...args) },
  board: { findUnique: (...args: unknown[]) => findBoard(...args) },
} }));
vi.mock("@/lib/boardAccess", () => ({ isBoardAdmin: (...args: unknown[]) => boardAdmin(...args) }));
vi.mock("@/lib/organizations", () => ({ requireOrganizationManager: (...args: unknown[]) => organizationManager(...args) }));
const { exchangeOAuthToken, issueAuthorizationCode } = await import("@/lib/mcp/oauth");
const verifier = "a".repeat(43);
const challenge = createHash("sha256").update(verifier).digest("base64url");
const callback = "https://chatgpt.com/connector_platform_oauth_redirect";
const resource = "https://kikiboard.test/api/mcp";

function authorization() {
  return new URLSearchParams({ client_id: "chatgpt", redirect_uri: callback, response_type: "code", state: "state", resource, scope: "tickets:read", code_challenge_method: "S256", code_challenge: challenge });
}
function exchange() {
  return new URLSearchParams({ grant_type: "authorization_code", code: "code_secret", redirect_uri: callback, resource, code_verifier: verifier });
}
function grant(overrides = {}) {
  return { id: "grant-1", clientId: "chatgpt", redirectUri: callback, resource, codeChallenge: challenge,
    codeExpiresAt: new Date(Date.now() + 300000), refreshExpiresAt: new Date(Date.now() + 86400000),
    externalAccessToken: { scopes: ["tickets:read"], organizationId: "org-1", boardId: null, revokedAt: null, expiresAt: null, board: null }, ...overrides };
}
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://kikiboard.test");
  vi.stubEnv("MCP_OAUTH_CLIENT_ID", "chatgpt");
  vi.stubEnv("MCP_OAUTH_CLIENT_SECRET", "test-only-client-secret-at-least-32-characters");
  vi.stubEnv("MCP_OAUTH_REDIRECT_URIS", callback);
  vi.clearAllMocks();
  findGrant.mockResolvedValue(grant());
  updateGrant.mockResolvedValue({ count: 1 });
});

describe("ChatGPT OAuth boundaries", () => {
  it("requires explicit client configuration", () => {
    vi.stubEnv("MCP_OAUTH_CLIENT_SECRET", "");
    expect(() => oauthConfig()).toThrow();
  });
  it("accepts only the configured callback, resource, read scope and S256 PKCE", () => {
    expect(parseAuthorizationRequest(authorization()).resource).toBe(resource);
    for (const [key, value] of [["redirect_uri", "https://evil.test/callback"], ["resource", "https://other.test"], ["scope", "tickets:write"], ["client_id", "other"], ["code_challenge_method", "plain"], ["code_challenge", "bad"], ["state", ""]]) {
      const params = authorization(); params.set(key, value);
      expect(() => parseAuthorizationRequest(params)).toThrow();
    }
    const duplicate = authorization(); duplicate.append("redirect_uri", callback);
    expect(() => parseAuthorizationRequest(duplicate)).toThrow();
  });
  it("echoes state and exact issuer for successful and declined authorization", () => {
    for (const result of [{ code: "code" }, { error: "access_denied" }]) {
      const url = new URL(authorizationCallback(parseAuthorizationRequest(authorization()), result));
      expect(url.searchParams.get("state")).toBe("state");
      expect(url.searchParams.get("iss")).toBe("https://kikiboard.test");
    }
  });
  it("checks client secrets for both supported authentication methods", () => {
    const params = new URLSearchParams({ client_id: "chatgpt", client_secret: "test-only-client-secret-at-least-32-characters" });
    expect(authenticateOAuthClient(new Request(resource), params)).toBe(true);
    params.set("client_secret", "wrong");
    expect(authenticateOAuthClient(new Request(resource), params)).toBe(false);
    const request = new Request(resource, { headers: { authorization: `Basic ${Buffer.from("chatgpt:test-only-client-secret-at-least-32-characters").toString("base64")}` } });
    expect(authenticateOAuthClient(request, new URLSearchParams())).toBe(true);
  });
  it("rejects an incorrect verifier", () => {
    expect(verifyPkce(verifier, challenge)).toBe(true);
    expect(verifyPkce("b".repeat(43), challenge)).toBe(false);
  });
  it("persists only hashes and atomically consumes authorization codes", async () => {
    const result = await exchangeOAuthToken(exchange());
    expect(result?.access_token).toMatch(/^kiki_oauth_/);
    expect(updateGrant).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "grant-1", codeHash: oauthHash("code_secret") },
      data: expect.objectContaining({ codeHash: null, accessTokenHash: oauthHash(result!.access_token), refreshTokenHash: oauthHash(result!.refresh_token) }),
    }));
    updateGrant.mockResolvedValue({ count: 0 });
    expect(await exchangeOAuthToken(exchange())).toBeNull();
  });
  it("rejects expired, foreign or revoked grants without rotating tokens", async () => {
    for (const value of [
      grant({ clientId: "other" }), grant({ resource: "https://other.test" }),
      grant({ codeExpiresAt: new Date(0) }), grant({ refreshExpiresAt: new Date(0) }),
      grant({ externalAccessToken: { ...grant().externalAccessToken, revokedAt: new Date() } }),
      grant({ externalAccessToken: { ...grant().externalAccessToken, boardId: "board-1", board: { organizationId: "org-other" } } }),
    ]) {
      findGrant.mockResolvedValue(value);
      expect(await exchangeOAuthToken(exchange())).toBeNull();
    }
    expect(updateGrant).not.toHaveBeenCalled();
  });
  it("rejects wrong callback, verifier and resource on code exchange", async () => {
    for (const [key, value] of [["redirect_uri", "https://evil.test"], ["code_verifier", "b".repeat(43)], ["resource", "https://other.test"]]) {
      const params = exchange(); params.set(key, value);
      expect(await exchangeOAuthToken(params)).toBeNull();
    }
    expect(updateGrant).not.toHaveBeenCalled();
  });
  it("rotates refresh tokens once without extending the 30-day connection", async () => {
    const params = new URLSearchParams({ grant_type: "refresh_token", refresh_token: "refresh_old", resource });
    expect(await exchangeOAuthToken(params)).not.toBeNull();
    expect(updateGrant.mock.calls[0][0].where).toEqual({ id: "grant-1", refreshTokenHash: oauthHash("refresh_old") });
    expect(updateGrant.mock.calls[0][0].data).not.toHaveProperty("refreshExpiresAt");
    updateGrant.mockResolvedValue({ count: 0 });
    expect(await exchangeOAuthToken(params)).toBeNull();
  });
  it("checks current permissions before creating organization or board credentials", async () => {
    organizationManager.mockResolvedValue(false); boardAdmin.mockResolvedValue(false);
    const request = parseAuthorizationRequest(authorization());
    await expect(issueAuthorizationCode("user-1", request, "organization:org-1")).rejects.toThrow();
    await expect(issueAuthorizationCode("user-1", request, "board:board-1")).rejects.toThrow();
    expect(createCredential).not.toHaveBeenCalled();
    organizationManager.mockResolvedValue(true);
    const code = await issueAuthorizationCode("user-1", request, "organization:org-1");
    const data = createCredential.mock.calls[0][0].data;
    expect(data.organizationId).toBe("org-1"); expect(data.boardId).toBeNull();
    expect(data.oauthGrant.create.codeHash).toBe(oauthHash(code));
    expect(data.oauthGrant.create).not.toHaveProperty("code");
  });
});
