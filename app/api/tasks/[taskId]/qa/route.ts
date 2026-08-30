import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { hasBoardAccess, isBoardAdmin } from "@/lib/boardAccess";
import { createActivity } from "@/lib/createActivity";
import { encodeLogMessage } from "@/lib/activityMessages";

export async function POST(
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

  const boardId = task.list.board.id;
  // Los administradores asignan siempre; los miembros solo si el board lo permite.
  const canManage = await isBoardAdmin(user.id, boardId);
  const hasAccess = await hasBoardAccess(user.id, boardId);

  if (!hasAccess) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!canManage && !task.list.board.memberCanAssign) {
    return NextResponse.json({ error: "Sin permiso para asignar QA" }, { status: 403 });
  }

  const body = await req.json();
  const qaId = body.qaId ? String(body.qaId) : null;

  // Toggle if clicked same QA, otherwise set new or null
  const targetQaId = task.qaId === qaId ? null : qaId;

  const updated = await db.task.update({
    where: { id: taskId },
    data: { qaId: targetQaId },
    include: {
      qa: { select: { id: true, name: true, email: true } },
    },
  });

  const actorName = user.name ?? user.email;

  if (targetQaId) {
    if (targetQaId !== user.id) {
      await db.notification.create({
        data: {
          type: "qa_assigned",
          message: encodeLogMessage("notifications.assignedYouQa", {
            actor: actorName,
            ticket: task.title,
          }),
          userId: targetQaId,
          boardId: task.list.board.id,
          taskId,
        },
      });
    }

    const qaName = updated.qa?.name ?? updated.qa?.email ?? targetQaId;
    await createActivity({
      type: "task_qa_assigned",
      key: "activity.qaAssigned",
      params: { actor: actorName, name: qaName, ticket: task.title },
      boardId: task.list.board.id,
      userId: user.id,
    });
  } else {
    await createActivity({
      type: "task_qa_unassigned",
      key: "activity.qaRemoved",
      params: { actor: actorName, ticket: task.title },
      boardId: task.list.board.id,
      userId: user.id,
    });
  }

  return NextResponse.json({
    success: true,
    qaId: updated.qaId,
    qa: updated.qa,
  });
}
