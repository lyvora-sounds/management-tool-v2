import { oauthServerConfig, OAUTH_SCOPE, OAUTH_WRITE_SCOPE } from "@/lib/mcp/oauthConfig";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    const config = oauthServerConfig();
    return Response.json({
      issuer: config.issuer,
      authorization_endpoint: `${config.issuer}/api/mcp/oauth/authorize`,
      token_endpoint: `${config.issuer}/api/mcp/oauth/token`,
      response_types_supported: ["code"], grant_types_supported: ["authorization_code", "refresh_token"],
      token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic"],
      code_challenge_methods_supported: ["S256"], scopes_supported: [OAUTH_SCOPE, OAUTH_WRITE_SCOPE],
      authorization_response_iss_parameter_supported: true,
    });
  } catch {
    return Response.json({ error: "OAuth is not configured" }, { status: 503 });
  }
}
