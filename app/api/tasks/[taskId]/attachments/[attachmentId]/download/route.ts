import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { canReadBoard } from "@/lib/boardAccess";

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

  let response: Response;
  try {
    response = await fetch(attachment.url, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });
  } catch (err) {
    console.error("[BLOB FETCH ERROR]", err);
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 502 });
  }

  if (!response.ok) {
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 502 });
  }

  const contentType = response.headers.get("content-type") ?? "application/octet-stream";

  return new Response(response.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${attachment.filename}"`,
    },
  });
}
