import { describe, expect, it } from "vitest";
import { mcpApiRewrites } from "@/lib/mcpApiRewrites";

const API = "https://api.example.com";

describe("mcpApiRewrites", () => {
  it("forwards nothing unless the flag and the API address are both set", () => {
    expect(mcpApiRewrites({})).toEqual([]);
    expect(mcpApiRewrites({ NEXT_PUBLIC_API_URL: API })).toEqual([]);
    expect(mcpApiRewrites({ MCP_API_REWRITES: "1" })).toEqual([]);
    expect(mcpApiRewrites({ MCP_API_REWRITES: "true", NEXT_PUBLIC_API_URL: API })).toEqual([]);
    expect(mcpApiRewrites({ MCP_API_REWRITES: "1", NEXT_PUBLIC_API_URL: "  " })).toEqual([]);
  });

  it("maps the MCP endpoint, the OAuth server and the discovery documents to the API", () => {
    const rewrites = mcpApiRewrites({ MCP_API_REWRITES: "1", NEXT_PUBLIC_API_URL: `${API}/` });
    expect(rewrites).toEqual([
      { source: "/api/mcp", destination: `${API}/v1/mcp` },
      { source: "/api/mcp/org/:organizationId", destination: `${API}/v1/mcp/org/:organizationId` },
      { source: "/api/mcp/board/:boardId", destination: `${API}/v1/mcp/board/:boardId` },
      { source: "/api/mcp/oauth/authorize", destination: `${API}/v1/mcp/oauth/authorize` },
      { source: "/api/mcp/oauth/token", destination: `${API}/v1/mcp/oauth/token` },
      { source: "/.well-known/oauth-authorization-server", destination: `${API}/.well-known/oauth-authorization-server` },
      { source: "/.well-known/oauth-protected-resource", destination: `${API}/.well-known/oauth-protected-resource` },
      { source: "/.well-known/oauth-protected-resource/:path*", destination: `${API}/.well-known/oauth-protected-resource/:path*` },
    ]);
  });

  it("leaves the consent routes to the app", () => {
    const sources = mcpApiRewrites({ MCP_API_REWRITES: "1", NEXT_PUBLIC_API_URL: API }).map((rewrite) => rewrite.source);
    expect(sources).not.toContain("/api/mcp/oauth/consent");
  });
});
