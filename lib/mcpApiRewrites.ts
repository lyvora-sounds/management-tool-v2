/**
 * The MCP endpoint and its OAuth server are served by kiki-api, under the public address of this app, so connectors
 * already authorised keep working (the issuer and the resource URLs are this app's). `NEXT_PUBLIC_API_URL` is read
 * when the app is built; without it nothing is forwarded and these paths answer 404.
 *
 * The consent page is not forwarded: it needs the Clerk session of this app, and its client calls the API directly.
 */
export type McpRewrite = { source: string; destination: string };

const PATHS: ReadonlyArray<readonly [source: string, destination: string]> = [
  ["/api/mcp", "/v1/mcp"],
  ["/api/mcp/org/:organizationId", "/v1/mcp/org/:organizationId"],
  ["/api/mcp/board/:boardId", "/v1/mcp/board/:boardId"],
  ["/api/mcp/oauth/authorize", "/v1/mcp/oauth/authorize"],
  ["/api/mcp/oauth/token", "/v1/mcp/oauth/token"],
  ["/.well-known/oauth-authorization-server", "/.well-known/oauth-authorization-server"],
  ["/.well-known/oauth-protected-resource", "/.well-known/oauth-protected-resource"],
  ["/.well-known/oauth-protected-resource/:path*", "/.well-known/oauth-protected-resource/:path*"],
];

export function mcpApiRewrites(env: Readonly<Record<string, string | undefined>>): McpRewrite[] {
  const api = env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (!api) return [];
  return PATHS.map(([source, destination]) => ({ source, destination: `${api}${destination}` }));
}
