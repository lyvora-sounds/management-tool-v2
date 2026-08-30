import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { hasBoardAccess } from "@/lib/boardAccess";
import { createActivity } from "@/lib/createActivity";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, boardId } = await req.json();

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (!boardId) {
    return NextResponse.json({ error: "Board ID is required" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { clerkId: userId } });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await hasBoardAccess(user.id, boardId);
  if (!allowed) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  const lastList = await db.list.findFirst({
    where: { boardId },
    orderBy: { order: "desc" },
  });

  const list = await db.list.create({
    data: {
      title: title.trim(),
      boardId,
      order: lastList ? lastList.order + 1 : 0,
    },
  });

  await createActivity({
    type: "list_created",
    key: "activity.listCreated",
    params: { actor: user.name ?? user.email, list: list.title },
    boardId,
    userId: user.id,
  });

  return NextResponse.json(list, { status: 201 });
}
