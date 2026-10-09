import { parseAuthorizationRequest, oauthConfig } from "@/lib/mcp/oauthConfig";

export function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    parseAuthorizationRequest(params);
    const consent = new URL("/dashboard/mcp-authorize", oauthConfig().issuer);
    consent.search = params.toString();
    return new Response(null, { status: 302, headers: { location: consent.toString(), "cache-control": "no-store" } });
  } catch {
    // Never redirect errors to a callback that has not been validated.
    return Response.json({ error: "Invalid authorization request or OAuth is not configured" }, { status: 400 });
  }
}
