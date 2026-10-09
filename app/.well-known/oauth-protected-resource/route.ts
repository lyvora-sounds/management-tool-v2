import { oauthServerConfig, OAUTH_SCOPE, OAUTH_WRITE_SCOPE } from "@/lib/mcp/oauthConfig";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    const config = oauthServerConfig();
    return Response.json({ resource: config.resource, authorization_servers: [config.issuer], scopes_supported: [OAUTH_SCOPE, OAUTH_WRITE_SCOPE], bearer_methods_supported: ["header"] });
  } catch {
    return Response.json({ error: "OAuth is not configured" }, { status: 503 });
  }
}
