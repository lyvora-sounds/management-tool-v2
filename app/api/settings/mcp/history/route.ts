import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";
import { isBoardAdmin } from "@/lib/boardAccess";
import { requireOrganizationManager } from "@/lib/organizations";
import { type ExternalAccessContext, TICKETS_READ_SCOPE, TICKETS_WRITE_SCOPE } from "@/lib/externalAccess";
import { changeScope, listMcpChanges, revertMcpChange, McpWriteError } from "@/lib/mcp/writes";
import { oauthServerConfig } from "@/lib/mcp/oauthConfig";

const headers = { "cache-control": "no-store" };

async function scope(params: URLSearchParams) {
  const { userId } = await auth();
  const user = userId ? await db.user.findUnique({ where: { clerkId: userId }, select: { id: true } }) : null;
  if (!user) return null;
  const organizationId = params.get("organizationId");
  const boardId = params.get("boardId");
  if (!organizationId) return null;
  if (boardId) {
    const board = await db.board.findFirst({ where: { id: boardId, organizationId }, select: { id: true } });
    if (!board || !(await isBoardAdmin(user.id, boardId))) return null;
  } else if (!(await requireOrganizationManager(user.id, organizationId))) return null;
  const context: ExternalAccessContext = { tokenId: "", organizationId, boardId: boardId || null, boardTitle: null, scopes: [TICKETS_READ_SCOPE, TICKETS_WRITE_SCOPE] };
  return { userId: user.id, context };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const actor = await scope(params);
  if (!actor) return Response.json({ error: "Not found" }, { status: 404, headers });
  const id = params.get("changeId");
  if (!id) return Response.json(await listMcpChanges(actor.context), { headers });
  const change = await db.mcpChange.findFirst({ where: { id, ...changeScope(actor.context) }, select: { id: true, kind: true, summary: true, before: true, after: true, revertedAt: true, boardId: true } });
  if (!change) return Response.json({ error: "Not found" }, { status: 404, headers });
  const lists = await db.list.findMany({ where: { boardId: change.boardId }, select: { id: true, title: true } });
  return Response.json({ ...change, listNames: Object.fromEntries(lists.map((list) => [list.id, list.title])) }, { headers });
}

export async function POST(request: Request) {
  if (request.headers.get("origin") !== oauthServerConfig().issuer) return Response.json({ error: "Invalid origin" }, { status: 403, headers });
  const actor = await scope(new URL(request.url).searchParams);
  if (!actor) return Response.json({ error: "Not found" }, { status: 404, headers });
  const body = await request.json().catch(() => null);
  if (typeof body?.changeId !== "string" || body.confirm !== true) return Response.json({ error: "Explicit confirmation is required" }, { status: 400, headers });
  try {
    return Response.json(await revertMcpChange(actor.context, body.changeId, true, actor.userId), { headers });
  } catch (error) {
    return Response.json({ error: error instanceof McpWriteError ? error.message : "Revert could not be completed" }, { status: 409, headers });
  }
}
