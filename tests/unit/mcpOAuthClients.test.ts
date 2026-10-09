import { beforeEach, describe, expect, it, vi } from "vitest";
import { authenticateOAuthClient, oauthHash, parseAuthorizationRequest } from "@/lib/mcp/oauthConfig";

const findClient = vi.fn();
const createClient = vi.fn();
const listClients = vi.fn();
const revokeClient = vi.fn();
const revokeTokens = vi.fn();
const auth = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({ auth: (...args: unknown[]) => auth(...args) }));
vi.mock("@/lib/db", () => ({ default: {
  user: { findUnique: vi.fn(async () => ({ id: "user-1" })) },
  mcpOAuthClient: { findUnique: (...args: unknown[]) => findClient(...args), create: (...args: unknown[]) => createClient(...args), findMany: (...args: unknown[]) => listClients(...args) },
  $transaction: (callback: (tx: unknown) => unknown) => callback({ mcpOAuthClient: { updateMany: revokeClient }, externalAccessToken: { updateMany: revokeTokens } }),
} }));
const { validChatGptCallback, resolveOAuthClient } = await import("@/lib/mcp/oauthClients");
const { GET, POST, DELETE } = await import("@/app/api/settings/mcp/oauth-clients/route");
const callback = "https://chatgpt.com/connector_platform_oauth_redirect";
function request(method: string, data: unknown, origin = "https://kikiboard.test") {
  return new Request("https://kikiboard.test/api/settings/mcp/oauth-clients", { method, headers: { origin, "content-type": "application/json" }, body: JSON.stringify(data) });
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://kikiboard.test");
  vi.stubEnv("MCP_OAUTH_CLIENT_SECRET", "");
  auth.mockResolvedValue({ userId: "clerk-1" });
  createClient.mockImplementation(async ({ data }) => ({ id: data.id, redirectUris: data.redirectUris }));
  revokeClient.mockResolvedValue({ count: 1 });
});
describe("in-app ChatGPT setup", () => {
  it("accepts write scope only for a client whose owner enabled it", async () => {
    const response = await POST(request("POST", { redirectUri: callback, allowWrite: true }));
    expect(response.status).toBe(201);
    const data = createClient.mock.calls[0][0].data;
    expect(data.allowWrite).toBe(true);
    findClient.mockResolvedValue({ ...data, revokedAt: null });
    const client = (await resolveOAuthClient(data.id))!;
    const params = new URLSearchParams({ client_id: data.id, redirect_uri: callback, resource: "https://kikiboard.test/api/mcp", state: "state", response_type: "code", code_challenge_method: "S256", code_challenge: "a".repeat(43), scope: "tickets:read tickets:write" });
    expect(parseAuthorizationRequest(params, client).writeRequested).toBe(true);
    expect(() => parseAuthorizationRequest(params, { ...client, allowWrite: false })).toThrow();
  });
  it("accepts only exact HTTPS ChatGPT OAuth callbacks", () => {
    expect(validChatGptCallback(callback)).toBe(true);
    expect(validChatGptCallback("https://chatgpt.com/connector/oauth/callback-123")).toBe(true);
    for (const value of ["https://evil.test/callback", "https://chatgpt.com.evil.test/connector_platform_oauth_redirect", "http://chatgpt.com/connector_platform_oauth_redirect", `${callback}?next=evil`, `${callback}#fragment`, "https://user:password@chatgpt.com/connector_platform_oauth_redirect", "https://chatgpt.com/"]) expect(validChatGptCallback(value)).toBe(false);
  });
  it("generates an account-owned client without deployment credentials and stores only a secret hash", async () => {
    const response = await POST(request("POST", { redirectUri: callback }));
    expect(response.status).toBe(201); expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json();
    expect(body.id).toMatch(/^kiki_client_/); expect(body.secret.length).toBeGreaterThan(32);
    const data = createClient.mock.calls[0][0].data;
    expect(data.secretHash).toBe(oauthHash(body.secret)); expect(data).not.toHaveProperty("secret"); expect(data.createdById).toBe("user-1");
    findClient.mockResolvedValue({ ...data, revokedAt: null });
    const client = await resolveOAuthClient(body.id);
    expect(client?.ownerId).toBe("user-1");
    expect(authenticateOAuthClient(new Request(callback), new URLSearchParams({ client_id: body.id, client_secret: body.secret }), client!)).toBe(true);
    const params = new URLSearchParams({ client_id: body.id, redirect_uri: callback, resource: "https://kikiboard.test/api/mcp", state: "state", response_type: "code", code_challenge_method: "S256", code_challenge: "a".repeat(43) });
    expect(parseAuthorizationRequest(params, client!).ownerId).toBe("user-1");
  });
  it("blocks unauthenticated and cross-origin credential creation", async () => {
    expect((await POST(request("POST", { redirectUri: callback }, "https://evil.test"))).status).toBe(403);
    auth.mockResolvedValue({ userId: null });
    expect((await POST(request("POST", { redirectUri: callback }))).status).toBe(401);
    expect(createClient).not.toHaveBeenCalled();
  });
  it("returns only metadata for the current account", async () => {
    listClients.mockResolvedValue([]);
    await GET();
    expect(listClients.mock.calls[0][0].where).toEqual({ createdById: "user-1", revokedAt: null });
    expect(listClients.mock.calls[0][0].select).not.toHaveProperty("secretHash");
  });
  it("revokes the current account's client and its connections together", async () => {
    const response = await DELETE(request("DELETE", { id: "kiki_client_1" }));
    expect(response.status).toBe(200);
    expect(revokeClient.mock.calls[0][0].where).toMatchObject({ id: "kiki_client_1", createdById: "user-1" });
    expect(revokeTokens.mock.calls[0][0].where).toEqual({ oauthGrant: { clientId: "kiki_client_1" } });
    revokeClient.mockResolvedValue({ count: 0 }); revokeTokens.mockClear();
    expect((await DELETE(request("DELETE", { id: "foreign-client" }))).status).toBe(404);
    expect(revokeTokens).not.toHaveBeenCalled();
  });
  it("rejects revoked or deleted clients", async () => {
    findClient.mockResolvedValue({ revokedAt: new Date() });
    expect(await resolveOAuthClient("kiki_client_1")).toBeNull();
    findClient.mockResolvedValue(null);
    expect(await resolveOAuthClient("kiki_client_1")).toBeNull();
  });
});
