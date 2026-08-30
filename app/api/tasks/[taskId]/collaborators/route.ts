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
    return NextResponse.json({ error: "Sin permiso para asignar colaboradores" }, { status: 403 });
  }

  const body = await req.json();
  const collaboratorId = body.collaboratorId ?? body.userId ?? body.assigneeId;

  if (!collaboratorId) {
    return NextResponse.json({ error: "Collaborator ID is required" }, { status: 400 });
  }

  const existing = await db.taskCollaborator.findUnique({
    where: { taskId_userId: { taskId, userId: collaboratorId } },
  });

  const actorName = user.name ?? user.email;
  const collaboratorUser = await db.user.findUnique({
    where: { id: collaboratorId },
    select: { name: true, email: true },
  });
  const collabName = collaboratorUser?.name ?? collaboratorUser?.email ?? collaboratorId;

  if (existing) {
    await db.taskCollaborator.delete({
      where: { taskId_userId: { taskId, userId: collaboratorId } },
    });

    await createActivity({
      type: "task_collaborator_removed",
      key: "activity.collaboratorRemoved",
      params: { actor: actorName, name: collabName, ticket: task.title },
      boardId: task.list.board.id,
      userId: user.id,
    });

    return NextResponse.json({ active: false, userId: collaboratorId });
  } else {
    await db.taskCollaborator.create({
      data: { taskId, userId: collaboratorId },
    });

    // Notify collaborator if not self
    if (collaboratorId !== user.id) {
      await db.notification.create({
        data: {
          type: "collaborator_added",
          message: encodeLogMessage("notifications.addedYouCollaborator", {
            actor: actorName,
            ticket: task.title,
          }),
          userId: collaboratorId,
          boardId: task.list.board.id,
          taskId,
        },
      });
    }

    // Log activity
    await createActivity({
      type: "task_collaborator_added",
      key: "activity.collaboratorAdded",
      params: { actor: actorName, name: collabName, ticket: task.title },
      boardId: task.list.board.id,
      userId: user.id,
    });

    return NextResponse.json({ active: true, userId: collaboratorId });
  }
}
