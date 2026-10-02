import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { readableBoardWhere } from "@/lib/boardAccess";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { clerkId: userId } });

  if (!user) {
    return NextResponse.json([], { status: 200 });
  }

  const boards = await db.board.findMany({
    where: readableBoardWhere(user.id),
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(boards);
}
