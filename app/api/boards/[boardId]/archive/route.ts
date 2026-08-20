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

  const { searchParams } = new URL(req.url);
  const quarter = searchParams.get("quarter");

  const tasks = await db.task.findMany({
    where: {
      list: { boardId },
      archived: true,
      ...(quarter ? { quarter } : {}),
    },
    orderBy: { archivedAt: "desc" },
    include: {
      list: { select: { id: true, title: true } },
      epic: { select: { id: true, title: true, color: true } },
      labels: { include: { label: true } },
    },
  });

  return NextResponse.json({ tasks });
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
  const { taskIds, completedOnly, quarter, beforeDate } = body;

  let whereClause: any = {
    list: { boardId },
    archived: false,
  };

  if (Array.isArray(taskIds) && taskIds.length > 0) {
    whereClause.id = { in: taskIds };
  } else {
    if (completedOnly) {
      whereClause.completed = true;
    }
    if (quarter) {
      whereClause.quarter = quarter;
    }
    if (beforeDate) {
      whereClause.createdAt = { lte: new Date(beforeDate) };
    }
  }

  const result = await db.task.updateMany({
    where: whereClause,
    data: {
      archived: true,
      archivedAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
    archivedCount: result.count,
  });
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
  const { taskIds } = body;

  if (!Array.isArray(taskIds) || taskIds.length === 0) {
    return NextResponse.json({ error: "Lista de taskIds requerida" }, { status: 400 });
  }

  const result = await db.task.updateMany({
    where: {
      id: { in: taskIds },
      list: { boardId },
    },
    data: {
      archived: false,
      archivedAt: null,
    },
  });

  return NextResponse.json({
    success: true,
    unarchivedCount: result.count,
  });
}
