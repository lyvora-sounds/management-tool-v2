import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { hasBoardAccess } from "@/lib/boardAccess";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boardId } = await params;
  const canAccess = await hasBoardAccess(user.id, boardId);
  if (!canAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [lists, epics] = await Promise.all([
    db.list.findMany({
      where: { boardId },
      orderBy: { order: "asc" },
      include: {
        tasks: {
          where: { archived: false },
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            completed: true,
            listId: true,
          },
        },
      },
    }),
    db.epic.findMany({
      where: { boardId },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        color: true,
      },
    }),
  ]);

  const tasks = lists.flatMap((list) =>
    list.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      completed: task.completed,
      listTitle: list.title,
    }))
  );

  return NextResponse.json({ tasks, epics });
}
