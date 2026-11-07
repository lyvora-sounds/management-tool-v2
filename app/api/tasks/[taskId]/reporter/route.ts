import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { canEditBoard, canReadBoard, isBoardAdmin } from "@/lib/boardAccess";
import { createActivity } from "@/lib/createActivity";
import { encodeLogMessage } from "@/lib/activityMessages";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> },
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
  const canManage = await isBoardAdmin(user.id, boardId);
  const hasAccess = await canEditBoard(user.id, boardId);

  if (!hasAccess) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!canManage && !task.list.board.memberCanAssign) {
    return NextResponse.json(
      { error: "Sin permiso para asignar reporter" },
      { status: 403 },
    );
  }

  const body = await req.json();
  const reporterId = body.reporterId ? String(body.reporterId) : null;
  const targetReporterId = task.reporterId === reporterId ? null : reporterId;

  if (targetReporterId && !(await canReadBoard(targetReporterId, boardId))) {
    return NextResponse.json(
      { error: "That person has no access to this board" },
      { status: 400 },
    );
  }

  const updated = await db.task.update({
    where: { id: taskId },
    data: { reporterId: targetReporterId },
    include: {
      reporter: { select: { id: true, name: true, email: true } },
    },
  });

  const actorName = user.name ?? user.email;

  if (targetReporterId) {
    if (targetReporterId !== user.id) {
      await db.notification.create({
        data: {
          type: "reporter_assigned",
          message: encodeLogMessage("notifications.assignedYouReporter", {
            actor: actorName,
            ticket: task.title,
          }),
          userId: targetReporterId,
          boardId,
          taskId,
        },
      });
    }

    const reporterName =
      updated.reporter?.name ?? updated.reporter?.email ?? targetReporterId;
    await createActivity({
      type: "task_reporter_assigned",
      key: "activity.reporterAssigned",
      params: { actor: actorName, name: reporterName, ticket: task.title },
      boardId,
      userId: user.id,
    });
  } else {
    await createActivity({
      type: "task_reporter_unassigned",
      key: "activity.reporterRemoved",
      params: { actor: actorName, ticket: task.title },
      boardId,
      userId: user.id,
    });
  }

  return NextResponse.json({
    success: true,
    reporterId: updated.reporterId,
    reporter: updated.reporter,
  });
}
