import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { readableBoardWhere } from "@/lib/boardAccess";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ boards: [], tasks: [] });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ boards: [], tasks: [] });

  const [boards, tasks] = await Promise.all([
    db.board.findMany({
      where: {
        ...readableBoardWhere(user.id),
        title: { contains: q, mode: "insensitive" },
      },
      select: { id: true, title: true, color: true },
      take: 5,
    }),
    db.task.findMany({
      where: {
        title: { contains: q, mode: "insensitive" },
        list: {
          board: readableBoardWhere(user.id),
        },
      },
      select: {
        id: true,
        title: true,
        completed: true,
        list: {
          select: {
            title: true,
            boardId: true,
            board: { select: { title: true } },
          },
        },
      },
      take: 10,
    }),
  ]);

  return NextResponse.json({ boards, tasks });
}
