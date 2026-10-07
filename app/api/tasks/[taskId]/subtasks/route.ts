import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { canEditBoard, canReadBoard } from "@/lib/boardAccess";

async function getTaskAndCheck(taskId: string, userId: string, write: boolean) {
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { list: { include: { board: true } } },
  });
  if (!task) return null;
  const allowed = write
    ? await canEditBoard(userId, task.list.board.id)
    : await canReadBoard(userId, task.list.board.id);
  if (!allowed) return null;
  return task;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await getTaskAndCheck(taskId, user.id, false);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const subtasks = await db.subtask.findMany({
    where: { taskId },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(subtasks);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await getTaskAndCheck(taskId, user.id, true);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { title } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const last = await db.subtask.findFirst({ where: { taskId }, orderBy: { order: "desc" } });

  const subtask = await db.subtask.create({
    data: { title: title.trim(), taskId, order: last ? last.order + 1 : 0 },
  });

  return NextResponse.json(subtask, { status: 201 });
}
