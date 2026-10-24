import { audienceFromMetadataPath, mcpProtectedResourceDocument } from "@/lib/mcp/oauthConfig";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const audience = audienceFromMetadataPath((await params).path);
  if (!audience) return Response.json({ error: "Not found" }, { status: 404, headers: { "cache-control": "no-store" } });
  try {
    return Response.json(mcpProtectedResourceDocument(audience), { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ error: "OAuth is not configured" }, { status: 503 });
  }
}
