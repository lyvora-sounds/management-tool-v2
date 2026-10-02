import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { canEditBoard } from "@/lib/boardAccess";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ labelId: string }> }
) {
  const { labelId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, color } = await req.json();

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const label = await db.label.findUnique({
    where: { id: labelId },
    include: { board: true },
  });
  if (!label) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = await canEditBoard(user.id, label.board.id);
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.label.update({
    where: { id: labelId },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(color !== undefined && { color }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ labelId: string }> }
) {
  const { labelId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const label = await db.label.findUnique({
    where: { id: labelId },
    include: { board: true },
  });
  if (!label) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = await canEditBoard(user.id, label.board.id);
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.label.delete({ where: { id: labelId } });

  return NextResponse.json({ success: true });
}
