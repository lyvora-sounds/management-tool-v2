import { beforeEach, describe, expect, it, vi } from "vitest";
import { mcpConnectionName, mcpConnectionSnippet, mcpScopeEndpoint } from "@/lib/mcp/connectionName";
import {
  audienceFromMetadataPath,
  filterConsentScopes,
  parseMcpResource,
} from "@/lib/mcp/oauthConfig";

const orgId = "c".repeat(25);
const boardId = "b".repeat(25);

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://kikiboard.test");
});

describe("MCP resource URLs", () => {
  it("accepts the canonical URL and one organization or board path", () => {
    expect(parseMcpResource("https://kikiboard.test/api/mcp")).toEqual({ kind: "canonical" });
    expect(parseMcpResource(`https://kikiboard.test/api/mcp/org/${orgId}`)).toEqual({ kind: "organization", organizationId: orgId });
    expect(parseMcpResource(`https://kikiboard.test/api/mcp/board/${boardId}`)).toEqual({ kind: "board", boardId });
  });

  it("rejects another host, a query string, a short id, and an extra path", () => {
    expect(parseMcpResource("https://other.test/api/mcp")).toBeNull();
    expect(parseMcpResource(`https://kikiboard.test/api/mcp/org/${orgId}?token=secret`)).toBeNull();
    expect(parseMcpResource("https://kikiboard.test/api/mcp/org/org-1")).toBeNull();
    expect(parseMcpResource(`https://kikiboard.test/api/mcp/org/${orgId}/extra`)).toBeNull();
    expect(parseMcpResource("https://kikiboard.test/api/mcp/")).toBeNull();
  });

  it("locks consent to the scope named by the URL", () => {
    const organizations = [{ id: orgId, name: "Lyvora" }, { id: "d".repeat(25), name: "KIKI" }];
    const boards = [{ id: boardId, title: "Checkout" }, { id: "e".repeat(25), title: "Other" }];
    expect(filterConsentScopes({ kind: "organization", organizationId: orgId }, organizations, boards)).toEqual({
      organizations: [{ id: orgId, name: "Lyvora" }],
      boards: [],
    });
    expect(filterConsentScopes({ kind: "board", boardId }, organizations, boards).boards).toEqual([{ id: boardId, title: "Checkout" }]);
    expect(filterConsentScopes({ kind: "canonical" }, organizations, boards)).toEqual({ organizations, boards });
  });

  it("reads scoped discovery paths and ignores anything else", () => {
    expect(audienceFromMetadataPath(["api", "mcp", "org", orgId])).toEqual({ kind: "organization", organizationId: orgId });
    expect(audienceFromMetadataPath(["api", "mcp", "board", boardId])).toEqual({ kind: "board", boardId });
    expect(audienceFromMetadataPath(["api", "mcp"])).toBeNull();
    expect(audienceFromMetadataPath(["api", "mcp", "org", "short"])).toBeNull();
  });

  it("names a connection from the organization or board", () => {
    expect(mcpConnectionName("Lyvora sounds Organization")).toBe("kikiboard-lyvora-sounds-organization");
    expect(mcpConnectionName("Checkout")).toBe("kikiboard-checkout");
    expect(mcpConnectionName("")).toBe("kikiboard-connection");
  });

  it("gives each organization and board a distinct URL and copyable server entry", () => {
    const origin = "https://kikiboard.xyz";
    const lyvora = mcpScopeEndpoint(origin, "organization", orgId);
    const kiki = mcpScopeEndpoint(origin, "organization", "d".repeat(25));
    const checkout = mcpScopeEndpoint(origin, "board", orgId, boardId);
    expect(lyvora).toBe(`https://kikiboard.xyz/api/mcp/org/${orgId}`);
    expect(kiki).not.toBe(lyvora);
    expect(checkout).toBe(`https://kikiboard.xyz/api/mcp/board/${boardId}`);
    const lyvoraGemini = mcpConnectionSnippet("gemini", lyvora, mcpConnectionName("Lyvora sounds Organization"));
    const checkoutGrok = mcpConnectionSnippet("grok", checkout, mcpConnectionName("Checkout"));
    expect(lyvoraGemini).toContain("kikiboard-lyvora-sounds-organization");
    expect(lyvoraGemini).toContain(lyvora);
    expect(lyvoraGemini).not.toContain(kiki);
    expect(checkoutGrok).toContain(`grok mcp add --transport http kikiboard-checkout ${checkout}`);
    expect(checkoutGrok).not.toContain(lyvora);
  });
});

describe("scoped MCP routes", () => {
  it("rejects an organization path that is not a scope id before authentication", async () => {
    const { POST, GET } = await import("@/app/api/mcp/org/[organizationId]/route");
    const missing = await POST(new Request("https://kikiboard.test/api/mcp/org/nope", { method: "POST" }), {
      params: Promise.resolve({ organizationId: "nope" }),
    });
    expect(missing.status).toBe(404);
    const method = await GET(new Request(`https://kikiboard.test/api/mcp/org/${orgId}`), {
      params: Promise.resolve({ organizationId: orgId }),
    });
    expect(method.status).toBe(405);
    expect(method.headers.get("allow")).toBe("POST");
  });
});

describe("scoped OAuth discovery", () => {
  it("advertises the organization or board resource and hides unknown paths", async () => {
    const { GET } = await import("@/app/.well-known/oauth-protected-resource/[...path]/route");
    const found = await GET(new Request(`https://kikiboard.test/.well-known/oauth-protected-resource/api/mcp/org/${orgId}`), {
      params: Promise.resolve({ path: ["api", "mcp", "org", orgId] }),
    });
    expect(found.status).toBe(200);
    await expect(found.json()).resolves.toMatchObject({
      resource: `https://kikiboard.test/api/mcp/org/${orgId}`,
      authorization_servers: ["https://kikiboard.test"],
      bearer_methods_supported: ["header"],
    });
    const missing = await GET(new Request("https://kikiboard.test/.well-known/oauth-protected-resource/api/mcp"), {
      params: Promise.resolve({ path: ["api", "mcp"] }),
    });
    expect(missing.status).toBe(404);
  });
});
