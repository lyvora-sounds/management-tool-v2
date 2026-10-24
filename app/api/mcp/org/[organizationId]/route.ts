import { handleMcpPost, mcpMethodNotAllowed, mcpNotFound } from "@/lib/mcp/http";
import { isMcpScopeId } from "@/lib/mcp/oauthConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ organizationId: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const { organizationId } = await params;
  if (!isMcpScopeId(organizationId)) return mcpNotFound();
  return handleMcpPost(request, { kind: "organization", organizationId });
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { organizationId } = await params;
  if (!isMcpScopeId(organizationId)) return mcpNotFound();
  return mcpMethodNotAllowed();
}

export const DELETE = GET;
