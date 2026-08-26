import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { hasBoardAccess } from "@/lib/boardAccess";

export async function GET(
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

  const comments = await db.comment.findMany({
    where: { taskId },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content is required" }, { status: 400 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { list: { include: { board: true } } },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = await hasBoardAccess(user.id, task.list.board.id);
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const taskWithMembers = await db.task.findUnique({
    where: { id: taskId },
    select: {
      assigneeId: true,
      qaId: true,
      collaborators: { select: { userId: true } },
    },
  });

  const notifyUserIds = new Set<string>();
  if (taskWithMembers?.assigneeId && taskWithMembers.assigneeId !== user.id) {
    notifyUserIds.add(taskWithMembers.assigneeId);
  }
  if (taskWithMembers?.qaId && taskWithMembers.qaId !== user.id) {
    notifyUserIds.add(taskWithMembers.qaId);
  }
  taskWithMembers?.collaborators.forEach((c) => {
    if (c.userId !== user.id) notifyUserIds.add(c.userId);
  });

  const actorName = user.name ?? user.email;
  const notifyList = Array.from(notifyUserIds);

  const [comment] = await db.$transaction([
    db.comment.create({
      data: { content: content.trim(), taskId, userId: user.id },
      include: { user: { select: { name: true, email: true } } },
    }),
    ...(notifyList.length > 0
      ? [
          db.notification.createMany({
            data: notifyList.map((notifyUserId) => ({
              type: "comment",
              message: `${actorName} comentó en la tarea "${task.title}"`,
              userId: notifyUserId,
              boardId: task.list.board.id,
              taskId,
            })),
          }),
        ]
      : []),
  ]);

  return NextResponse.json(comment, { status: 201 });
}
