import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { canEditBoard } from "@/lib/boardAccess";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { labelId } = await req.json();

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { list: { include: { board: true } } },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = await canEditBoard(user.id, task.list.board.id);
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await db.taskLabel.findUnique({
    where: { taskId_labelId: { taskId, labelId } },
  });

  if (existing) {
    await db.taskLabel.delete({ where: { taskId_labelId: { taskId, labelId } } });
    return NextResponse.json({ active: false });
  } else {
    await db.taskLabel.create({ data: { taskId, labelId } });
    return NextResponse.json({ active: true });
  }
}
