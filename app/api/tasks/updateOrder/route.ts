import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { hasBoardAccess } from "@/lib/boardAccess";
import { createActivity } from "@/lib/createActivity";

type OrderItem = { id: string; order: number; listId: string };

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { items, movedTaskId, fromListId, toListId } = await req.json();

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Invalid items" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const taskIds = (items as OrderItem[]).map((i) => i.id);
  const listIds = Array.from(new Set((items as OrderItem[]).map((i) => i.listId)));

  const [tasks, lists] = await Promise.all([
    db.task.findMany({
      where: { id: { in: taskIds } },
      select: { id: true, list: { select: { boardId: true } } },
    }),
    db.list.findMany({
      where: { id: { in: listIds } },
      select: { id: true, boardId: true },
    }),
  ]);

  if (tasks.length !== taskIds.length || lists.length !== listIds.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const boardIds = new Set<string>([
    ...tasks.map((t) => t.list.boardId),
    ...lists.map((l) => l.boardId),
  ]);
  if (boardIds.size !== 1) {
    return NextResponse.json({ error: "Cross-board updates not allowed" }, { status: 400 });
  }

  const [boardId] = boardIds;
  const allowed = await hasBoardAccess(user.id, boardId);
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await Promise.all(
    (items as OrderItem[]).map(({ id, order, listId }) =>
      db.task.update({ where: { id }, data: { order, listId } }),
    ),
  );

  if (movedTaskId && fromListId && toListId && fromListId !== toListId) {
    const [task, fromList, toList] = await Promise.all([
      db.task.findUnique({ where: { id: movedTaskId }, select: { title: true, list: { select: { boardId: true } } } }),
      db.list.findUnique({ where: { id: fromListId }, select: { title: true } }),
      db.list.findUnique({ where: { id: toListId }, select: { title: true } }),
    ]);
    if (task && fromList && toList) {
      await createActivity({
        type: "task_moved",
        message: `${user.name ?? user.email} movió "${task.title}" de "${fromList.title}" a "${toList.title}"`,
        boardId: task.list.boardId,
        userId: user.id,
      });
    }
  }

  return NextResponse.json({ success: true });
}
