import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { hasBoardAccess } from "@/lib/boardAccess";
import { ensureDefaultCustomFields } from "@/lib/ensureDefaultCustomFields";
import { syncParentChildRelationships } from "@/lib/customValuesSync";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId } = await params;
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { id: true, list: { select: { boardId: true } } },
  });

  if (!task) {
    return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
  }

  const boardId = task.list.boardId;
  const canAccess = await hasBoardAccess(user.id, boardId);
  if (!canAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await ensureDefaultCustomFields(boardId);

  const [fields, values] = await Promise.all([
    db.customField.findMany({
      where: { boardId, enabled: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
    db.customFieldValue.findMany({
      where: { taskId },
      include: { customField: true },
    }),
  ]);

  return NextResponse.json({ fields, values });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId } = await params;
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { id: true, list: { select: { boardId: true } } },
  });

  if (!task) {
    return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
  }

  const canAccess = await hasBoardAccess(user.id, task.list.boardId);
  if (!canAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { customFieldId, value } = body;

  if (!customFieldId) {
    return NextResponse.json(
      { error: "customFieldId is required" },
      { status: 400 }
    );
  }

  const customField = await db.customField.findUnique({
    where: { id: customFieldId },
  });

  if (!customField || customField.boardId !== task.list.boardId) {
    return NextResponse.json({ error: "Campo no encontrado" }, { status: 404 });
  }

  const existingRecord = await db.customFieldValue.findUnique({
    where: {
      taskId_customFieldId: {
        taskId,
        customFieldId,
      },
    },
  });

  const oldValue = existingRecord?.value ?? null;
  const valStr = value !== undefined && value !== null ? String(value) : null;

  const customVal = await db.customFieldValue.upsert({
    where: {
      taskId_customFieldId: {
        taskId,
        customFieldId,
      },
    },
    update: {
      value: valStr,
    },
    create: {
      taskId,
      customFieldId,
      value: valStr,
    },
    include: {
      customField: true,
    },
  });

  await syncParentChildRelationships({
    boardId: task.list.boardId,
    currentTaskId: taskId,
    customField,
    oldValue,
    newValue: valStr,
  });

  return NextResponse.json(customVal);
}
