import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { canEditBoard } from "@/lib/boardAccess";

async function checkAccess(subtaskId: string, userId: string) {
  const subtask = await db.subtask.findUnique({
    where: { id: subtaskId },
    include: { task: { include: { list: { include: { board: true } } } } },
  });
  if (!subtask) return null;
  const allowed = await canEditBoard(userId, subtask.task.list.board.id);
  if (!allowed) return null;
  return subtask;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ taskId: string; subtaskId: string }> },
) {
  const { subtaskId } = await params;
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subtask = await checkAccess(subtaskId, user.id);
  if (!subtask)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { title, completed } = await req.json();

  const updated = await db.subtask.update({
    where: { id: subtaskId },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(completed !== undefined && { completed }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ taskId: string; subtaskId: string }> },
) {
  const { subtaskId } = await params;
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subtask = await checkAccess(subtaskId, user.id);
  if (!subtask)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.subtask.delete({ where: { id: subtaskId } });

  return NextResponse.json({ ok: true });
}
