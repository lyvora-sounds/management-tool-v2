import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { isBoardAdmin } from "@/lib/boardAccess";
import { isDiscordWebhookUrl, isSlackWebhookUrl } from "@/lib/notifications/webhooks";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Quien tenga una URL de webhook puede publicar en el canal del equipo: leerla es tan restringido como escribirla.
  const hasAccess = await isBoardAdmin(userId, boardId);
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

  // Escribir aquí redirige los webhooks de Slack/Discord, es decir, a dónde
  // se envía la actividad del board. No es cosa de cualquier miembro.
  const admin = await isBoardAdmin(userId, boardId);
  if (!admin) {
    return NextResponse.json(
      { error: "Solo los administradores pueden cambiar las integraciones" },
      { status: 403 }
    );
  }

  const body = await req.json();

  // Only Slack and Discord addresses are stored: the server posts to them, and anything else would let an admin
  // aim the server at an internal address. An empty value clears the integration.
  for (const [field, isAllowed, name] of [
    ["slackWebhookUrl", isSlackWebhookUrl, "Slack"],
    ["discordWebhookUrl", isDiscordWebhookUrl, "Discord"],
  ] as const) {
    const value = body[field];
    if (typeof value === "string" && value.trim() && !isAllowed(value.trim())) {
      return NextResponse.json({ error: `The ${name} webhook URL must be an https address on ${name}` }, { status: 400 });
    }
  }

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
