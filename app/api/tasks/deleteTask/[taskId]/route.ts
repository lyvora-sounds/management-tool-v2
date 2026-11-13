import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { canEditBoard } from "@/lib/boardAccess";
import { createActivity } from "@/lib/createActivity";
import { extractRequestAuditMeta, recordSecurityAuditLog } from "@/lib/securityAudit";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { list: { include: { board: true } } },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = await canEditBoard(user.id, task.list.board.id);
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.task.delete({ where: { id: taskId } });

  const auditMeta = extractRequestAuditMeta(req.headers);
  await recordSecurityAuditLog(db, {
    boardId: task.list.board.id,
    organizationId: task.list.board.organizationId,
    actorId: user.id,
    actorEmail: user.email,
    ipAddress: auditMeta.ipAddress,
    userAgent: auditMeta.userAgent,
    action: "TICKET_DELETED",
    entityType: "TASK",
    entityId: task.id,
    beforeState: {
      id: task.id,
      title: task.title,
      listId: task.listId,
      assigneeId: task.assigneeId,
      completed: task.completed,
    },
    afterState: null,
  });

  await createActivity({
    type: "task_deleted",
    key: "activity.ticketDeleted",
    params: { actor: user.name ?? user.email, ticket: task.title },
    boardId: task.list.board.id,
    userId: user.id,
  });

  return NextResponse.json({ success: true });
}
