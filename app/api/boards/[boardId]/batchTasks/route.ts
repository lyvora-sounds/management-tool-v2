import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { canAccessBoard } from "@/lib/boardAccess";
import { createActivity } from "@/lib/createActivity";

interface BatchTaskItem {
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string | null;
  startDate?: string | null;
  quarter?: string | null;
  listId: string;
  epicId?: string | null;
  subtasks?: { title: string }[];
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

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const body = await req.json();
  const { tasks }: { tasks: BatchTaskItem[] } = body;

  if (!Array.isArray(tasks) || tasks.length === 0) {
    return NextResponse.json({ error: "No se proporcionaron tareas" }, { status: 400 });
  }

  // Find max orders for each list
  const listIds = Array.from(new Set(tasks.map((t) => t.listId)));
  const existingCounts = await db.task.groupBy({
    by: ["listId"],
    where: { listId: { in: listIds } },
    _count: { id: true },
  });

  const listOrderMap = new Map<string, number>();
  existingCounts.forEach((c) => {
    listOrderMap.set(c.listId, c._count.id);
  });

  const createdTasks = [];

  for (const item of tasks) {
    const currentOrder = listOrderMap.get(item.listId) || 0;
    listOrderMap.set(item.listId, currentOrder + 1);

    const task = await db.task.create({
      data: {
        title: item.title,
        description: item.description || null,
        priority: item.priority || "medium",
        dueDate: item.dueDate ? new Date(item.dueDate) : null,
        startDate: item.startDate ? new Date(item.startDate) : null,
        quarter: item.quarter || null,
        listId: item.listId,
        epicId: item.epicId || null,
        order: currentOrder,
        subtasks: {
          create: (item.subtasks || []).map((s, idx) => ({
            title: s.title,
            order: idx,
          })),
        },
      },
      include: {
        labels: { include: { label: true } },
        subtasks: true,
        assignees: { include: { user: true } },
        epic: true,
      },
    });

    createdTasks.push(task);
  }

  await createActivity({
    boardId,
    userId: user.id,
    type: "task_created",
    message: `ha creado ${createdTasks.length} tareas mediante Brain Dump con IA`,
  });

  return NextResponse.json({
    success: true,
    count: createdTasks.length,
    tasks: createdTasks,
  });
}
