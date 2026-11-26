import { describe, expect, it } from "vitest";
import { mcpApiRewrites } from "@/lib/mcpApiRewrites";

const API = "https://api.example.com";

describe("mcpApiRewrites", () => {
  it("forwards nothing without the API address, and needs no flag with it", () => {
    expect(mcpApiRewrites({})).toEqual([]);
    expect(mcpApiRewrites({ NEXT_PUBLIC_API_URL: "  " })).toEqual([]);
    expect(mcpApiRewrites({ NEXT_PUBLIC_API_URL: API })).toHaveLength(8);
  });

  it("maps the MCP endpoint, the OAuth server and the discovery documents to the API", () => {
    const rewrites = mcpApiRewrites({ NEXT_PUBLIC_API_URL: `${API}/` });
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

  it("does not forward the consent routes: the browser calls the API for them", () => {
    const sources = mcpApiRewrites({ NEXT_PUBLIC_API_URL: API }).map((rewrite) => rewrite.source);
    expect(sources).not.toContain("/api/mcp/oauth/consent");
  });
});
