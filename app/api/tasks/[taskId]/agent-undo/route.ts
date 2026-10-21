import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { canEditBoard } from "@/lib/boardAccess";
import { TICKETS_READ_SCOPE, TICKETS_WRITE_SCOPE, type ExternalAccessContext } from "@/lib/externalAccess";
import { McpWriteError, revertMcpChange } from "@/lib/mcp/writes";

const headers = { "cache-control": "no-store" };

// Deshace un cambio que Kiki aplicó en este ticket. Solo cambios enlazados a un
// comentario de Kiki de este mismo ticket, y solo quien puede editar el tablero.
export async function POST(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });

  const body = await req.json().catch(() => null);
  if (typeof body?.changeId !== "string") return NextResponse.json({ error: "changeId is required" }, { status: 400, headers });

  const comment = await db.comment.findFirst({
    where: { taskId, agentChangeId: body.changeId, user: { isAgent: true } },
    select: { task: { select: { list: { select: { board: { select: { id: true, title: true, organizationId: true } } } } } } },
  });
  const board = comment?.task.list.board;
  if (!board || !(await canEditBoard(user.id, board.id))) return NextResponse.json({ error: "Not found" }, { status: 404, headers });

  const context: ExternalAccessContext = { tokenId: "", organizationId: board.organizationId, boardId: board.id, boardTitle: board.title, scopes: [TICKETS_READ_SCOPE, TICKETS_WRITE_SCOPE] };
  try {
    await revertMcpChange(context, body.changeId, true, user.id);
    return NextResponse.json({ ok: true }, { headers });
  } catch (error) {
    return NextResponse.json({ error: error instanceof McpWriteError ? error.message : "Undo could not be completed" }, { status: 409, headers });
  }
}
