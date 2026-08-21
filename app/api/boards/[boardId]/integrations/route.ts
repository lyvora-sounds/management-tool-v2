import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { hasBoardAccess } from "@/lib/boardAccess";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const hasAccess = await hasBoardAccess(userId, boardId);
  if (!hasAccess) return NextResponse.json({ error: "Sin acceso" }, { status: 403 });

  const board = await db.board.findUnique({
    where: { id: boardId },
    select: {
      slackWebhookUrl: true,
      discordWebhookUrl: true,
      notifyOnTaskCreated: true,
      notifyOnTaskCompleted: true,
      notifyOnTaskMoved: true,
    },
  });

  if (!board) return NextResponse.json({ error: "Board no encontrado" }, { status: 404 });

  return NextResponse.json(board);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const hasAccess = await hasBoardAccess(userId, boardId);
  if (!hasAccess) return NextResponse.json({ error: "Sin acceso" }, { status: 403 });

  const body = await req.json();
  const {
    slackWebhookUrl,
    discordWebhookUrl,
    notifyOnTaskCreated,
    notifyOnTaskCompleted,
    notifyOnTaskMoved,
  } = body;

  const updated = await db.board.update({
    where: { id: boardId },
    data: {
      ...(slackWebhookUrl !== undefined && { slackWebhookUrl: slackWebhookUrl?.trim() || null }),
      ...(discordWebhookUrl !== undefined && { discordWebhookUrl: discordWebhookUrl?.trim() || null }),
      ...(notifyOnTaskCreated !== undefined && { notifyOnTaskCreated }),
      ...(notifyOnTaskCompleted !== undefined && { notifyOnTaskCompleted }),
      ...(notifyOnTaskMoved !== undefined && { notifyOnTaskMoved }),
    },
    select: {
      slackWebhookUrl: true,
      discordWebhookUrl: true,
      notifyOnTaskCreated: true,
      notifyOnTaskCompleted: true,
      notifyOnTaskMoved: true,
    },
  });

  return NextResponse.json(updated);
}
