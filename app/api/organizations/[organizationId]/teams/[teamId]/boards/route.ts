import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { isAssignableRole } from "@/lib/boardRoles";
import { requireOrganizationManager } from "@/lib/organizations";

async function authorize(clerkId: string | null, organizationId: string, teamId: string, boardId: string) {
  if (!clerkId) return false;
  const actor = await db.user.findUnique({ where: { clerkId }, select: { id: true } });
  if (!actor || !(await requireOrganizationManager(actor.id, organizationId))) return false;
  const [team, board] = await Promise.all([
    db.team.findFirst({ where: { id: teamId, organizationId }, select: { id: true } }),
    db.board.findFirst({ where: { id: boardId, organizationId }, select: { id: true } }),
  ]);
  return Boolean(team && board);
}

export async function POST(request: Request, { params }: { params: Promise<{ organizationId: string; teamId: string }> }) {
  const { organizationId, teamId } = await params;
  const { userId } = await auth();
  const body = await request.json().catch(() => null);
  const boardId = typeof body?.boardId === "string" ? body.boardId : "";
  const role = body?.role;
  if (!isAssignableRole(role) || !(await authorize(userId, organizationId, teamId, boardId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const grant = await db.boardTeamAccess.upsert({
    where: { boardId_teamId: { boardId, teamId } },
    create: { boardId, teamId, role },
    update: { role },
  });
  return NextResponse.json(grant);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ organizationId: string; teamId: string }> }) {
  const { organizationId, teamId } = await params;
  const { userId } = await auth();
  const body = await request.json().catch(() => null);
  const boardId = typeof body?.boardId === "string" ? body.boardId : "";
  if (!(await authorize(userId, organizationId, teamId, boardId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await db.boardTeamAccess.deleteMany({ where: { boardId, teamId } });
  return NextResponse.json({ success: true });
}
