/**
 * The MCP endpoint and its OAuth server are served by kiki-api, under the public address of this app, so connectors
 * already authorised keep working (the issuer and the resource URLs are this app's). Forwarding is opt-in: it needs
 * `MCP_API_REWRITES=1` and `NEXT_PUBLIC_API_URL`, and both are read when the app is built, so switching it on or off
 * takes a new deployment. Without them the handlers in `app/api/mcp` answer, as before.
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
  if (env.MCP_API_REWRITES !== "1" || !api) return [];
  return PATHS.map(([source, destination]) => ({ source, destination: `${api}${destination}` }));
}
