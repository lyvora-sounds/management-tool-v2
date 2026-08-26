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
          message: `${actorName} te asignó como QA en la tarea "${task.title}"`,
          userId: targetQaId,
          boardId: task.list.board.id,
          taskId,
        },
      });
    }

    const qaName = updated.qa?.name ?? updated.qa?.email ?? targetQaId;
    await createActivity({
      type: "task_qa_assigned",
      message: `${actorName} asignó a ${qaName} como QA de "${task.title}"`,
      boardId: task.list.board.id,
      userId: user.id,
    });
  } else {
    await createActivity({
      type: "task_qa_unassigned",
      message: `${actorName} removió al QA de la tarea "${task.title}"`,
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
