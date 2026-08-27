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
    listId,
    listTitle,
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

  let targetList = null;
  if (listId) {
    targetList = await db.list.findFirst({
      where: { id: listId, boardId: task.list.board.id },
    });
  } else if (listTitle && typeof listTitle === "string" && listTitle.trim()) {
    const trimmedTitle = listTitle.trim();
    targetList = await db.list.findFirst({
      where: {
        boardId: task.list.board.id,
        title: { equals: trimmedTitle, mode: "insensitive" },
      },
    });

    if (!targetList) {
      const lastList = await db.list.findFirst({
        where: { boardId: task.list.board.id },
        orderBy: { order: "desc" },
      });
      targetList = await db.list.create({
        data: {
          title: trimmedTitle,
          boardId: task.list.board.id,
          order: lastList ? lastList.order + 1 : 0,
        },
      });
    }
  }

  // Derive completed status if moving between lists without explicit completed flag
  let nextCompleted = completed;
  let nextCompletedAt = completed !== undefined ? (completed ? new Date() : null) : undefined;
  let nextCompletedById = completed !== undefined ? (completed ? user.id : null) : undefined;

  if (targetList && targetList.id !== task.listId && completed === undefined) {
    const isDoneList = /hecho|done|completad|finaliz/i.test(targetList.title);
    if (isDoneList) {
      nextCompleted = true;
      nextCompletedAt = new Date();
      nextCompletedById = user.id;
    } else if (task.completed) {
      nextCompleted = false;
      nextCompletedAt = null;
      nextCompletedById = null;
    }
  }

  const updated = await db.task.update({
    where: { id: taskId },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && {
        description: description.trim() || null,
      }),
      ...(targetList && { listId: targetList.id }),
      ...(nextCompleted !== undefined && {
        completed: nextCompleted,
        completedAt: nextCompletedAt,
        completedById: nextCompletedById,
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
      list: {
        include: {
          board: { select: { id: true, title: true, color: true } },
        },
      },
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

  if (targetList && targetList.id !== task.listId) {
    await createActivity({
      type: "task_moved",
      message: `${actor} movió la tarea "${task.title}" de "${task.list.title}" a "${targetList.title}"`,
      boardId: task.list.board.id,
      userId: user.id,
    });
  }

  if (nextCompleted !== undefined && nextCompleted !== task.completed) {
    await createActivity({
      type: nextCompleted ? "task_completed" : "task_reopened",
      message: nextCompleted
        ? `${actor} completó la tarea "${task.title}"`
        : `${actor} reactivó la tarea "${task.title}"`,
      boardId: task.list.board.id,
      userId: user.id,
    });

    if (nextCompleted) {
      // Trigger Slack / Discord webhook
      sendBoardWebhookNotification({
        boardId: task.list.board.id,
        eventType: "task_completed",
        taskTitle: updated.title,
        listTitle: updated.list.title,
        userName: actor,
        priority: updated.priority,
      });
    }
  } else if (title !== undefined && title.trim() !== task.title) {
    await createActivity({
      type: "task_renamed",
      message: `${actor} renombró la tarea "${task.title}" a "${title.trim()}"`,
      boardId: task.list.board.id,
      userId: user.id,
    });
  }

  return NextResponse.json(updated);
}
