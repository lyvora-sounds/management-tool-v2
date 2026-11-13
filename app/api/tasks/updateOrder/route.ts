import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { canEditBoard } from "@/lib/boardAccess";
import { createActivity } from "@/lib/createActivity";
import { isDoneList } from "@/lib/statusTheme";
import { recordTaskStateTransitions, type TaskStateMoveInput } from "@/lib/transitions";

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
      select: {
        id: true,
        listId: true,
        assigneeId: true,
        completed: true,
        createdAt: true,
        list: { select: { boardId: true, title: true } },
      },
    }),
    db.list.findMany({
      where: { id: { in: listIds } },
      select: { id: true, boardId: true, title: true },
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
  const allowed = await canEditBoard(user.id, boardId);
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const previousById = new Map(tasks.map((t) => [t.id, t]));
  const listTitleById = new Map(lists.map((l) => [l.id, l.title]));

  await db.$transaction(async (tx) => {
    const moves: TaskStateMoveInput[] = [];
    for (const { id, order, listId } of items as OrderItem[]) {
      const prev = previousById.get(id);
      await tx.task.update({ where: { id }, data: { order, listId } });
      if (prev && prev.listId !== listId) {
        const toTitle = listTitleById.get(listId) ?? "";
        moves.push({
          taskId: id,
          boardId,
          fromListId: prev.listId,
          fromListTitle: prev.list.title,
          toListId: listId,
          toListTitle: toTitle,
          movedById: user.id,
          assigneeIdAtMove: prev.assigneeId ?? null,
          completedAfterMove: isDoneList(toTitle) ? true : Boolean(prev.completed),
          taskCreatedAt: prev.createdAt ?? null,
        });
      }
    }
    if (moves.length > 0) {
      await recordTaskStateTransitions(tx, moves);
    }
  });

  if (movedTaskId && fromListId && toListId && fromListId !== toListId) {
    const [task, fromList, toList] = await Promise.all([
      db.task.findUnique({ where: { id: movedTaskId }, select: { title: true, list: { select: { boardId: true } } } }),
      db.list.findUnique({ where: { id: fromListId }, select: { title: true } }),
      db.list.findUnique({ where: { id: toListId }, select: { title: true } }),
    ]);
    if (task && fromList && toList) {
      await createActivity({
        type: "task_moved",
        key: "activity.ticketMoved",
        params: {
          actor: user.name ?? user.email,
          ticket: task.title,
          from: fromList.title,
          to: toList.title,
        },
        boardId: task.list.boardId,
        userId: user.id,
      });
    }
  }

  return NextResponse.json({ success: true });
}
