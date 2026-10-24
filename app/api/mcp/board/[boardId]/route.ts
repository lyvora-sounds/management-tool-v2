import { handleMcpPost, mcpMethodNotAllowed, mcpNotFound } from "@/lib/mcp/http";
import { isMcpScopeId } from "@/lib/mcp/oauthConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ boardId: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const { boardId } = await params;
  if (!isMcpScopeId(boardId)) return mcpNotFound();
  return handleMcpPost(request, { kind: "board", boardId });
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { boardId } = await params;
  if (!isMcpScopeId(boardId)) return mcpNotFound();
  return mcpMethodNotAllowed();
}

export const DELETE = GET;
