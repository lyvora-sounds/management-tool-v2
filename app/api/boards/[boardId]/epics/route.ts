import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { canAccessBoard } from "@/lib/boardAccess";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const hasAccess = await canAccessBoard(userId, boardId);
  if (!hasAccess) return NextResponse.json({ error: "Sin acceso" }, { status: 403 });

  const epics = await db.epic.findMany({
    where: { boardId },
    orderBy: { createdAt: "asc" },
    include: {
      tasks: {
        select: { id: true, completed: true, archived: true },
      },
    },
  });

  const formatted = epics.map((epic) => {
    const activeTasks = epic.tasks.filter((t) => !t.archived);
    const total = activeTasks.length;
    const completed = activeTasks.filter((t) => t.completed).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      id: epic.id,
      title: epic.title,
      description: epic.description,
      color: epic.color,
      quarter: epic.quarter,
      status: epic.status,
      totalTasks: total,
      completedTasks: completed,
      progress,
    };
  });

  return NextResponse.json({ epics: formatted });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const hasAccess = await canAccessBoard(userId, boardId);
  if (!hasAccess) return NextResponse.json({ error: "Sin acceso" }, { status: 403 });

  const body = await req.json();
  const { title, description, color, quarter } = body;

  if (!title || !title.trim()) {
    return NextResponse.json({ error: "El título del Epic es requerido" }, { status: 400 });
  }

  const epic = await db.epic.create({
    data: {
      boardId,
      title: title.trim(),
      description: description?.trim() || null,
      color: color || "#3b82f6",
      quarter: quarter?.trim() || null,
    },
  });

  return NextResponse.json(epic);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const hasAccess = await canAccessBoard(userId, boardId);
  if (!hasAccess) return NextResponse.json({ error: "Sin acceso" }, { status: 403 });

  const body = await req.json();
  const { id, title, description, color, quarter, status } = body;

  if (!id) return NextResponse.json({ error: "ID de Epic requerido" }, { status: 400 });

  const updated = await db.epic.update({
    where: { id, boardId },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(color !== undefined && { color }),
      ...(quarter !== undefined && { quarter: quarter?.trim() || null }),
      ...(status !== undefined && { status }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const hasAccess = await canAccessBoard(userId, boardId);
  if (!hasAccess) return NextResponse.json({ error: "Sin acceso" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const epicId = searchParams.get("epicId");

  if (!epicId) return NextResponse.json({ error: "ID de Epic requerido" }, { status: 400 });

  await db.epic.delete({
    where: { id: epicId, boardId },
  });

  return NextResponse.json({ success: true });
}
