import { mcpProtectedResourceDocument } from "@/lib/mcp/oauthConfig";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    return Response.json(mcpProtectedResourceDocument({ kind: "canonical" }));
  } catch {
    return Response.json({ error: "OAuth is not configured" }, { status: 503 });
  }
}
