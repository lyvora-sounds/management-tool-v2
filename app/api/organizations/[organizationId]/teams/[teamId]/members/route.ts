import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireOrganizationManager } from "@/lib/organizations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ organizationId: string; teamId: string }> },
) {
  const { organizationId, teamId } = await params;
  const { userId: clerkId } = await auth();
  const actor = clerkId ? await db.user.findUnique({ where: { clerkId }, select: { id: true } }) : null;
  if (!actor || !(await requireOrganizationManager(actor.id, organizationId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await request.json().catch(() => null);
  const targetUserId = typeof body?.userId === "string" ? body.userId : "";
  const [team, member] = await Promise.all([
    db.team.findFirst({ where: { id: teamId, organizationId }, select: { id: true } }),
    db.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId: targetUserId } },
      select: { userId: true },
    }),
  ]);
  if (!team || !member) return NextResponse.json({ error: "Team or organization member not found" }, { status: 404 });
  const result = await db.teamMember.upsert({
    where: { teamId_userId: { teamId, userId: targetUserId } },
    create: { teamId, userId: targetUserId },
    update: {},
  });
  return NextResponse.json(result, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ organizationId: string; teamId: string }> },
) {
  const { organizationId, teamId } = await params;
  const { userId: clerkId } = await auth();
  const actor = clerkId
    ? await db.user.findUnique({ where: { clerkId }, select: { id: true } })
    : null;
  if (!actor || !(await requireOrganizationManager(actor.id, organizationId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await request.json().catch(() => null);
  const targetUserId = typeof body?.userId === "string" ? body.userId : "";
  const team = await db.team.findFirst({
    where: { id: teamId, organizationId },
    select: { id: true },
  });
  if (!team || !targetUserId) {
    return NextResponse.json({ error: "Team or member not found" }, { status: 404 });
  }
  await db.teamMember.deleteMany({ where: { teamId, userId: targetUserId } });
  return NextResponse.json({ success: true });
}
