import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { readableBoardWhere } from "@/lib/boardAccess";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json([]);

  const { searchParams } = new URL(req.url);
  const year = parseInt(
    searchParams.get("year") ?? String(new Date().getFullYear()),
  );
  const month = parseInt(
    searchParams.get("month") ?? String(new Date().getMonth() + 1),
  );

  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0, 23, 59, 59);

  const tasks = await db.task.findMany({
    where: {
      dueDate: { gte: from, lte: to },
      list: {
        board: readableBoardWhere(user.id),
      },
    },
    select: {
      id: true,
      title: true,
      completed: true,
      dueDate: true,
      list: {
        select: {
          title: true,
          boardId: true,
          board: { select: { id: true, title: true, color: true } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json(tasks);
}
