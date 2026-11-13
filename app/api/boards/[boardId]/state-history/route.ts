import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { canReadBoard } from "@/lib/boardAccess";
import {
  getStateTransitionHistory,
  type MetricsDbClient,
} from "@/lib/metrics/storyPoints";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await params;
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await canReadBoard(user.id, boardId);
  if (!allowed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const taskId = url.searchParams.get("taskId") || null;
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  const rawLimit = url.searchParams.get("limit");
  const parsedLimit = rawLimit ? Number.parseInt(rawLimit, 10) : 100;
  const limit = Number.isFinite(parsedLimit) ? parsedLimit : 100;

  const transitions = await getStateTransitionHistory(
    db as unknown as MetricsDbClient,
    {
      boardId,
      taskId,
      startDate,
      endDate,
      limit,
    },
  );

  return NextResponse.json({ transitions });
}
