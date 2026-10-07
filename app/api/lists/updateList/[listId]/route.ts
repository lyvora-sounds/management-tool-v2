import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { canEditBoard } from "@/lib/boardAccess";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ listId: string }> }
) {
  const { listId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title } = await req.json();
  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const list = await db.list.findUnique({
    where: { id: listId },
    include: { board: true },
  });
  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = await canEditBoard(user.id, list.board.id);
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.list.update({
    where: { id: listId },
    data: { title: title.trim() },
  });

  return NextResponse.json(updated);
}
