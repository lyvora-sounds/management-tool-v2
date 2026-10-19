import { auth } from "@clerk/nextjs/server";
import { NextResponse, after } from "next/server";
import db from "@/lib/db";
import { canEditBoard } from "@/lib/boardAccess";
import { createActivity } from "@/lib/createActivity";
import { runTriage } from "@/lib/agent/triage";

// El triage de Kiki corre tras responder (after) y llama al modelo de IA.
export const maxDuration = 60;

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, listId } = await req.json();

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (!listId) {
    return NextResponse.json({ error: "List ID is required" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { clerkId: userId } });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const list = await db.list.findFirst({
    where: { id: listId },
  });

  if (!list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  const allowed = await canEditBoard(user.id, list.boardId);
  if (!allowed) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  const lastTask = await db.task.findFirst({
    where: { listId },
    orderBy: { order: "desc" },
  });

  const task = await db.task.create({
    data: {
      title: title.trim(),
      listId,
      order: lastTask ? lastTask.order + 1 : 0,
    },
  });

  await createActivity({
    type: "task_created",
    key: "activity.ticketCreated",
    params: { actor: user.name ?? user.email, ticket: task.title, list: list.title },
    boardId: list.boardId,
    userId: user.id,
  });

  const board = await db.board.findUnique({ where: { id: list.boardId }, select: { kikiTriage: true, kikiMode: true } });
  if (board?.kikiTriage && board.kikiMode !== "off") {
    after(() => runTriage({ taskId: task.id, creatorId: user.id }).catch((error) => console.error("[kiki:triage]", error)));
  }

  return NextResponse.json(task, { status: 201 });
}
