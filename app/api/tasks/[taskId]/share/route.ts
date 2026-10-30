import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import crypto from "crypto";
import db from "@/lib/db";
import { canEditBoard, canReadBoard } from "@/lib/boardAccess";

// A ticket the caller cannot reach answers like one that does not exist: they must not learn that it is there.
async function reachableTask(userId: string, taskId: string, need: "read" | "edit") {
  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return null;
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { id: true, shareToken: true, list: { select: { boardId: true } } },
  });
  if (!task) return null;
  const allowed = need === "edit" ? await canEditBoard(user.id, task.list.boardId) : await canReadBoard(user.id, task.list.boardId);
  return allowed ? task : null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const { taskId } = await params;
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const task = await reachableTask(userId, taskId, "read");
  if (!task) {
    return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    shareToken: task.shareToken,
    shareUrl: task.shareToken
      ? `${process.env.NEXT_PUBLIC_APP_URL || ""}/share/task/${task.shareToken}`
      : null,
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const { taskId } = await params;
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const task = await reachableTask(userId, taskId, "edit");
  if (!task) {
    return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
  }

  const token = task.shareToken || crypto.randomUUID();

  const updated = await db.task.update({
    where: { id: taskId },
    data: { shareToken: token },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const shareUrl = `${baseUrl}/share/task/${updated.shareToken}`;

  return NextResponse.json({
    shareToken: updated.shareToken,
    shareUrl,
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const { taskId } = await params;
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!(await reachableTask(userId, taskId, "edit"))) {
    return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
  }

  await db.task.update({
    where: { id: taskId },
    data: { shareToken: null },
  });

  return NextResponse.json({ success: true });
}
