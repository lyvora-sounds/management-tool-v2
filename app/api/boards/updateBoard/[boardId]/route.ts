import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { boardId } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, key: rawKey } = body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { clerkId: userId } });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const board = await db.board.findUnique({ where: { id: boardId } });

  if (!board || board.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: { title: string; key?: string } = { title: title.trim() };
  if (rawKey !== undefined) {
    if (typeof rawKey !== "string" || !/^[A-Za-z]{2}$/.test(rawKey.trim())) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    const key = rawKey.trim().toUpperCase();
    if (key !== board.key) {
      if (board.nextTicketNumber > 1) {
        return NextResponse.json({ error: "locked" }, { status: 409 });
      }
      const taken = await db.board.findFirst({
        where: { organizationId: board.organizationId, key, NOT: { id: boardId } },
        select: { id: true },
      });
      if (taken) return NextResponse.json({ error: "taken" }, { status: 409 });
      data.key = key;
    }
  }

  const updated = await db.board.update({
    where: { id: boardId },
    data,
  });

  return NextResponse.json(updated);
}
