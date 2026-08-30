import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { hasBoardAccess } from "@/lib/boardAccess";
import { createActivity } from "@/lib/createActivity";

export async function DELETE(
  _req: Request,
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

  const allowed = await hasBoardAccess(user.id, task.list.board.id);
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.task.delete({ where: { id: taskId } });

  await createActivity({
    type: "task_deleted",
    key: "activity.ticketDeleted",
    params: { actor: user.name ?? user.email, ticket: task.title },
    boardId: task.list.board.id,
    userId: user.id,
  });

  return NextResponse.json({ success: true });
}
