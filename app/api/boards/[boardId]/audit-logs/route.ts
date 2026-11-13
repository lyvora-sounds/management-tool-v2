import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";
import { canReadBoard } from "@/lib/boardAccess";
import { getSecurityAuditLogs } from "@/lib/securityAudit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> },
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boardId } = await params;
    const allowed = await canReadBoard(user.id, boardId);
    if (!allowed) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action") ?? undefined;
    const actorId = searchParams.get("actorId") ?? undefined;
    const entityType = searchParams.get("entityType") ?? undefined;
    const startDateRaw = searchParams.get("startDate");
    const endDateRaw = searchParams.get("endDate");
    const limitRaw = searchParams.get("limit");

    const startDate = startDateRaw ? new Date(startDateRaw) : undefined;
    const endDate = endDateRaw ? new Date(endDateRaw) : undefined;
    if ((startDate && Number.isNaN(startDate.getTime())) || (endDate && Number.isNaN(endDate.getTime()))) {
      return NextResponse.json({ error: "Invalid startDate or endDate" }, { status: 400 });
    }

    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 100;
    const auditLogs = await getSecurityAuditLogs(db, {
      boardId,
      action,
      actorId,
      entityType,
      startDate,
      endDate,
      limit: Number.isNaN(limit) ? 100 : limit,
    });

    return NextResponse.json({ boardId, auditLogs });
  } catch (error) {
    console.error("Failed to fetch security audit logs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
