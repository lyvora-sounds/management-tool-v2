import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { BlobUnavailableError, putBlob } from "@/lib/blobStore";
import { canEditBoard, canReadBoard } from "@/lib/boardAccess";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { list: { include: { board: true } } },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = await canReadBoard(user.id, task.list.board.id);
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const attachments = await db.attachment.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(attachments);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { list: { include: { board: true } } },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = await canEditBoard(user.id, task.list.board.id);
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  let blob;
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    blob = await putBlob(`attachments/${taskId}/${file.name}`, bytes, {
      contentType: file.type || "application/octet-stream",
    });
  } catch (err) {
    if (err instanceof BlobUnavailableError) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }
    console.error("[R2 PUT ERROR]", err);
    return NextResponse.json({ error: "No se pudo subir el archivo" }, { status: 502 });
  }

  const attachment = await db.attachment.create({
    data: {
      filename: file.name,
      url: blob.url,
      size: file.size,
      taskId,
    },
  });

  return NextResponse.json(attachment, { status: 201 });
}
