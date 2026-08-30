import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { hasBoardAccess, isBoardOwner } from "@/lib/boardAccess";
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
  const isOwner = await isBoardOwner(user.id, boardId);
  const hasAccess = await hasBoardAccess(user.id, boardId);

  if (!hasAccess) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!isOwner && !task.list.board.memberCanAssign) {
    return NextResponse.json({ error: "Sin permiso para asignar tareas" }, { status: 403 });
  }

  const { assigneeId } = await req.json();

  const targetAssigneeId = task.assigneeId === assigneeId ? null : assigneeId;
  const updated = await db.task.update({
    where: { id: taskId },
    data: { assigneeId: targetAssigneeId },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
    },
  });

  const actorName = user.name ?? user.email;

  if (targetAssigneeId) {
    if (targetAssigneeId !== user.id) {
      await db.notification.create({
        data: {
          type: "assigned",
          message: encodeLogMessage("notifications.assignedYou", {
            actor: actorName,
            ticket: task.title,
          }),
          userId: targetAssigneeId,
          boardId: task.list.board.id,
          taskId,
        },
      });
    }

    const assigneeName = updated.assignee?.name ?? updated.assignee?.email ?? targetAssigneeId;
    await createActivity({
      type: "task_assigned",
      key: "activity.ticketAssigned",
      params: { actor: actorName, ticket: task.title, assignee: assigneeName },
      boardId: task.list.board.id,
      userId: user.id,
    });

    return NextResponse.json({ active: true, assigneeId: targetAssigneeId });
  } else {
    await createActivity({
      type: "task_unassigned",
      key: "activity.ticketUnassigned",
      params: { actor: actorName, ticket: task.title },
      boardId: task.list.board.id,
      userId: user.id,
    });

    return NextResponse.json({ active: false, assigneeId: null });
  }
}
