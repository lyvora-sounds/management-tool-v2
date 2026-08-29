import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const boards = await db.board.findMany({
    where: {
      OR: [
        { userId: user.id },
        { members: { some: { userId: user.id } } },
      ],
    },
    include: {
      members: {
        where: { userId: user.id },
        select: { role: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = boards.map((board) => {
    const isOwner = board.userId === user.id;
    const memberRole = board.members[0]?.role;
    const isAdmin = isOwner || memberRole === "admin" || memberRole === "owner";

    return {
      id: board.id,
      title: board.title,
      color: board.color,
      isOwner,
      isAdmin,
    };
  });

  return NextResponse.json(formatted);
}
