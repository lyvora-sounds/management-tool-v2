import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import db from "@/lib/db";
import { canEditBoard } from "@/lib/boardAccess";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ taskId: string; attachmentId: string }> }
) {
  const { taskId, attachmentId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const attachment = await db.attachment.findUnique({
    where: { id: attachmentId },
    include: { task: { include: { list: { include: { board: true } } } } },
  });

  if (!attachment || attachment.taskId !== taskId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allowed = await canEditBoard(user.id, attachment.task.list.board.id);
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await del(attachment.url);
  } catch (err) {
    console.error("[BLOB DEL ERROR]", err);
  }
  await db.attachment.delete({ where: { id: attachmentId } });

  return NextResponse.json({ success: true });
}
