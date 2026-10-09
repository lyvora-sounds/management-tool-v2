import { validateAuthorizationRequest } from "@/lib/mcp/oauthClients";
import { oauthServerConfig } from "@/lib/mcp/oauthConfig";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    await validateAuthorizationRequest(params);
    const consent = new URL("/dashboard/mcp-authorize", oauthServerConfig().issuer);
    consent.search = params.toString();
    return new Response(null, { status: 302, headers: { location: consent.toString(), "cache-control": "no-store" } });
  } catch {
    // Never redirect errors to a callback that has not been validated.
    return Response.json({ error: "Invalid authorization request or OAuth is not configured" }, { status: 400 });
  }
}
