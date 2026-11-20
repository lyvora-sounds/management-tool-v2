import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { BlobUnavailableError, readBlob } from "@/lib/blobStore";
import { canReadBoard } from "@/lib/boardAccess";
import { attachmentHeaders } from "@/lib/attachmentHeaders";

export async function GET(
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

  const allowed = await canReadBoard(user.id, attachment.task.list.board.id);
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let file;
  try {
    file = await readBlob(attachment.url);
  } catch (err) {
    if (err instanceof BlobUnavailableError) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }
    console.error("[R2 FETCH ERROR]", err);
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 502 });
  }

  if (!file?.body) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // The type was chosen by whoever uploaded the file and this route is on the app's own origin: only plain
  // images, PDFs and text open in the tab, everything else downloads.
  return new Response(file.body, {
    headers: attachmentHeaders(attachment.filename, file.contentType),
  });
}
