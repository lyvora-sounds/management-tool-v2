import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { hasBoardAccess, isBoardOwner } from "@/lib/boardAccess";
import { createActivity } from "@/lib/createActivity";

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

  const existing = await db.taskAssignee.findUnique({
    where: { taskId_userId: { taskId, userId: assigneeId } },
  });

  if (existing) {
    await db.taskAssignee.delete({ where: { taskId_userId: { taskId, userId: assigneeId } } });
    return NextResponse.json({ active: false });
  } else {
    await db.taskAssignee.create({ data: { taskId, userId: assigneeId } });

    const actorName = user.name ?? user.email;

    // Notify the assignee (skip if assigning themselves)
    if (assigneeId !== user.id) {
      await db.notification.create({
        data: {
          type: "assigned",
          message: `${actorName} te asignó la tarea "${task.title}"`,
          userId: assigneeId,
          boardId: task.list.board.id,
          taskId,
        },
      });
    }

    // Log activity
    const assignee = await db.user.findUnique({ where: { id: assigneeId }, select: { name: true, email: true } });
    await createActivity({
      type: "task_assigned",
      message: `${actorName} asignó "${task.title}" a ${assignee?.name ?? assignee?.email ?? assigneeId}`,
      boardId: task.list.board.id,
      userId: user.id,
    });

    return NextResponse.json({ active: true });
  }
}
