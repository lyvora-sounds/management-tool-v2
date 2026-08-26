import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { hasBoardAccess } from "@/lib/boardAccess";
import { createActivity } from "@/lib/createActivity";
import { sendBoardWebhookNotification } from "@/lib/notifications/webhooks";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const { taskId } = await params;
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    title,
    description,
    completed,
    startDate,
    dueDate,
    priority,
    epicId,
    quarter,
    archived,
    assigneeId,
    qaId,
  } = await req.json();

  if (title !== undefined && (typeof title !== "string" || !title.trim())) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { list: { include: { board: true } } },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = await hasBoardAccess(user.id, task.list.board.id);
  if (!allowed)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.task.update({
    where: { id: taskId },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && {
        description: description.trim() || null,
      }),
      ...(completed !== undefined && {
        completed,
        completedAt: completed ? new Date() : null,
        completedById: completed ? user.id : null,
      }),
      ...(startDate !== undefined && {
        startDate: startDate ? new Date(startDate) : null,
      }),
      ...(dueDate !== undefined && {
        dueDate: dueDate ? new Date(dueDate) : null,
      }),
      ...(priority !== undefined && { priority: priority ?? null }),
      ...(epicId !== undefined && { epicId: epicId || null }),
      ...(quarter !== undefined && { quarter: quarter?.trim() || null }),
      ...(archived !== undefined && {
        archived,
        archivedAt: archived ? new Date() : null,
      }),
      ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
      ...(qaId !== undefined && { qaId: qaId || null }),
    },
    include: {
      epic: true,
      labels: { include: { label: true } },
      assignee: { select: { id: true, name: true, email: true } },
      qa: { select: { id: true, name: true, email: true } },
      collaborators: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  const actor = user.name ?? user.email;
  if (completed !== undefined) {
    await createActivity({
      type: completed ? "task_completed" : "task_reopened",
      message: completed
        ? `${actor} completó la tarea "${task.title}"`
        : `${actor} reactivó la tarea "${task.title}"`,
      boardId: task.list.board.id,
      userId: user.id,
    });

    if (completed) {
      // Trigger Slack / Discord webhook
      sendBoardWebhookNotification({
        boardId: task.list.board.id,
        eventType: "task_completed",
        taskTitle: updated.title,
        listTitle: task.list.title,
        userName: actor,
        priority: updated.priority,
      });
    }
  } else if (title !== undefined) {
    await createActivity({
      type: "task_renamed",
      message: `${actor} renombró la tarea "${task.title}" a "${title.trim()}"`,
      boardId: task.list.board.id,
      userId: user.id,
    });
  }

  return NextResponse.json(updated);
}
