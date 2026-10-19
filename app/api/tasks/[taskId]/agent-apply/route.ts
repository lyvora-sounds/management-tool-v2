import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { canEditBoard } from "@/lib/boardAccess";
import { TICKETS_READ_SCOPE, TICKETS_WRITE_SCOPE, type ExternalAccessContext } from "@/lib/externalAccess";
import { McpWriteError, updateMcpTickets } from "@/lib/mcp/writes";

const headers = { "cache-control": "no-store" };

// Aplica las sugerencias de triage de un comentario de Kiki. Actúa como quien
// pulsa el botón, así que valen sus permisos; el cambio queda enlazado al
// comentario y se puede deshacer con agent-undo.
export async function POST(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });

  const body = await req.json().catch(() => null);
  if (typeof body?.commentId !== "string") return NextResponse.json({ error: "commentId is required" }, { status: 400, headers });

  const comment = await db.comment.findFirst({
    where: { id: body.commentId, taskId, user: { isAgent: true }, agentSuggestion: { not: Prisma.DbNull } },
    select: { agentSuggestion: true, task: { select: { list: { select: { board: { select: { id: true, title: true, organizationId: true } } } } } } },
  });
  const board = comment?.task.list.board;
  if (!comment || !board || !(await canEditBoard(user.id, board.id))) return NextResponse.json({ error: "Not found" }, { status: 404, headers });

  const suggestion = comment.agentSuggestion as { changes?: Record<string, unknown>; applied?: boolean } | null;
  if (!suggestion?.changes || suggestion.applied) return NextResponse.json({ error: "Already applied" }, { status: 409, headers });

  // Se reclama primero para que un doble clic no aplique dos veces. SQL directo: `updatedAt` no debe moverse
  // o la instantánea del cambio (que incluye los comentarios) dejaría de coincidir al deshacer.
  const claimed = await db.$executeRaw`UPDATE "Comment" SET "agentSuggestion" = jsonb_set("agentSuggestion", '{applied}', 'true') WHERE "id" = ${body.commentId} AND ("agentSuggestion"->>'applied') = 'false'`;
  if (claimed !== 1) return NextResponse.json({ error: "Already applied" }, { status: 409, headers });

  const context: ExternalAccessContext = { tokenId: "", organizationId: board.organizationId, boardId: board.id, boardTitle: board.title, scopes: [TICKETS_READ_SCOPE, TICKETS_WRITE_SCOPE] };
  try {
    const applied = await updateMcpTickets(context, { updates: [{ ticketId: taskId, changes: suggestion.changes }], summary: "Kiki: triage" }, user.id);
    await db.$executeRaw`UPDATE "Comment" SET "agentChangeId" = ${applied.changeId} WHERE "id" = ${body.commentId}`;
    return NextResponse.json({ ok: true }, { headers });
  } catch (error) {
    await db.$executeRaw`UPDATE "Comment" SET "agentSuggestion" = jsonb_set("agentSuggestion", '{applied}', 'false') WHERE "id" = ${body.commentId}`;
    return NextResponse.json({ error: error instanceof McpWriteError ? error.message : "Could not apply" }, { status: 409, headers });
  }
}
