import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { canReadBoard } from "@/lib/boardAccess";
import {
  getBoardMetricsSummary,
  type AllocationPolicy,
  type GroupByInterval,
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
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  const rawGroupBy = url.searchParams.get("groupBy");
  const groupBy: GroupByInterval =
    rawGroupBy === "day" || rawGroupBy === "month" ? rawGroupBy : "week";
  const rawPolicy = url.searchParams.get("allocationPolicy");
  const allocationPolicy: AllocationPolicy =
    rawPolicy === "split" ? "split" : "primary";
  const filterUserId = url.searchParams.has("userId")
    ? url.searchParams.get("userId") || null
    : undefined;

  const summary = await getBoardMetricsSummary(
    db as unknown as MetricsDbClient,
    boardId,
    {
      startDate,
      endDate,
      groupBy,
      userId: filterUserId,
      allocationPolicy,
    },
  );

  return NextResponse.json(summary);
}
