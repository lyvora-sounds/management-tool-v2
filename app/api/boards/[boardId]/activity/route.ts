import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { canReadBoard } from "@/lib/boardAccess";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { boardId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await canReadBoard(user.id, boardId);
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const logs = await db.activityLog.findMany({
    where: { boardId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(logs);
}
