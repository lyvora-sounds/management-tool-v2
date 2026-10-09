import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { authenticateExternalAccess, recordExternalAccessUse } from "@/lib/externalAccess";
import { createScopedMcpServer } from "@/lib/mcp/scopedServer";
import { oauthConfig, OAUTH_SCOPE } from "@/lib/mcp/oauthConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  let challenge = "Bearer";
  try {
    challenge = `Bearer resource_metadata="${oauthConfig().issuer}/.well-known/oauth-protected-resource", scope="${OAUTH_SCOPE}"`;
  } catch {
    // Existing bearer clients still work when OAuth has not been configured.
  }
  return new Response(JSON.stringify({ error: "Invalid or expired access token" }), {
    status: 401,
    headers: {
      "content-type": "application/json",
      "www-authenticate": challenge,
      "cache-control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const context = await authenticateExternalAccess(request);
  if (!context) return unauthorized();

  const server = createScopedMcpServer(context);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  try {
    const response = await transport.handleRequest(request);
    if (response.ok) await recordExternalAccessUse(context.tokenId);
    return response;
  } finally {
    await transport.close();
    await server.close();
  }
}

export async function GET() {
  return new Response("MCP uses authenticated POST requests", {
    status: 405,
    headers: { Allow: "POST" },
  });
}

export const DELETE = GET;
