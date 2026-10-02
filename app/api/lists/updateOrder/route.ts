import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { canEditBoard } from "@/lib/boardAccess";

type OrderItem = { id: string; order: number };

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId, lists } = await req.json();

  if (!boardId || typeof boardId !== "string") {
    return NextResponse.json({ error: "boardId is required" }, { status: 400 });
  }
  if (!Array.isArray(lists) || lists.length === 0) {
    return NextResponse.json({ error: "Invalid lists" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await canEditBoard(user.id, boardId);
  if (!allowed) return NextResponse.json({ error: "Board not found" }, { status: 404 });

  const items = lists as OrderItem[];
  const ids = items.map((l) => l.id);
  const found = await db.list.findMany({
    where: { id: { in: ids }, boardId },
    select: { id: true },
  });
  if (found.length !== ids.length) {
    return NextResponse.json({ error: "Invalid list IDs" }, { status: 400 });
  }

  await db.$transaction(
    items.map(({ id, order }) =>
      db.list.update({ where: { id }, data: { order } })
    )
  );

  return NextResponse.json({ success: true });
}
