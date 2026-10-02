import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { authenticateExternalAccess, recordExternalAccessUse } from "@/lib/externalAccess";
import { createScopedMcpServer } from "@/lib/mcp/scopedServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return new Response(JSON.stringify({ error: "Invalid or expired access token" }), {
    status: 401,
    headers: {
      "content-type": "application/json",
      "www-authenticate": "Bearer",
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
