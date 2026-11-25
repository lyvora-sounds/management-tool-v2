import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { authenticateExternalAccess, recordExternalAccessUse, TICKETS_READ_SCOPE } from "@/lib/externalAccess";
import { createScopedMcpServer } from "@/lib/mcp/scopedServer";
import { mcpResourceMetadataUrl, OAUTH_SCOPE, type McpAudience } from "@/lib/mcp/oauthConfig";
import {
  createRateLimiter,
  extractClientIp,
  rateLimitHeaders,
  type RateLimitResult,
} from "@/lib/rateLimit";

const mcpIpLimiter = createRateLimiter({ limit: 120, windowMs: 60_000 });
const mcpTokenLimiter = createRateLimiter({ limit: 240, windowMs: 60_000 });

function tooManyRequests(result: RateLimitResult) {
  return new Response(JSON.stringify({ error: "Too many requests" }), {
    status: 429,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      ...rateLimitHeaders(result),
    },
  });
}

export function mcpNotFound() {
  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

export function mcpMethodNotAllowed() {
  return new Response("MCP uses authenticated POST requests", {
    status: 405,
    headers: { Allow: "POST" },
  });
}

function unauthorized(audience: McpAudience) {
  let challenge = "Bearer";
  try {
    challenge = `Bearer resource_metadata="${mcpResourceMetadataUrl(audience)}", scope="${OAUTH_SCOPE}"`;
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

export async function handleMcpPost(request: Request, audience: McpAudience = { kind: "canonical" }) {
  const ipLimit = mcpIpLimiter.check(extractClientIp(request.headers));
  if (!ipLimit.allowed) return tooManyRequests(ipLimit);

  const context = await authenticateExternalAccess(request, TICKETS_READ_SCOPE, audience);
  if (!context) return unauthorized(audience);

  const tokenLimit = mcpTokenLimiter.check(context.tokenId);
  if (!tokenLimit.allowed) return tooManyRequests(tokenLimit);

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
