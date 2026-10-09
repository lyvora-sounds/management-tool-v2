import { resolveOAuthClient } from "@/lib/mcp/oauthClients";
import { authenticateOAuthClient, oauthClientId } from "@/lib/mcp/oauthConfig";
import { exchangeOAuthToken } from "@/lib/mcp/oauth";

const headers = { "cache-control": "no-store", pragma: "no-cache" };

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) {
    return Response.json({ error: "invalid_request" }, { status: 400, headers });
  }
  const body = await request.text();
  if (body.length > 8192) return Response.json({ error: "invalid_request" }, { status: 400, headers });
  const params = new URLSearchParams(body);
  for (const key of params.keys()) {
    if (params.getAll(key).length !== 1) return Response.json({ error: "invalid_request" }, { status: 400, headers });
  }
  let clientId;
  try {
    clientId = oauthClientId(request, params);
    const client = await resolveOAuthClient(clientId);
    if (!client || !authenticateOAuthClient(request, params, client)) {
      return Response.json({ error: "invalid_client" }, { status: 401, headers });
    }
  } catch {
    return Response.json({ error: "invalid_client" }, { status: 401, headers });
  }
  const token = await exchangeOAuthToken(params, clientId);
  return token ? Response.json(token, { headers }) : Response.json({ error: "invalid_grant" }, { status: 400, headers });
}
