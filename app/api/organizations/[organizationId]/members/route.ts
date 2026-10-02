import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { isOrganizationRole, requireOrganizationManager } from "@/lib/organizations";

async function actor(clerkId: string | null) {
  return clerkId
    ? db.user.findUnique({ where: { clerkId }, select: { id: true } })
    : null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await params;
  const session = await auth();
  const user = await actor(session.userId);
  if (!user || !(await db.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  }))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const members = await db.organizationMember.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
    select: { role: true, createdAt: true, user: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(members);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await params;
  const session = await auth();
  const user = await actor(session.userId);
  if (!user || !(await requireOrganizationManager(user.id, organizationId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = body?.role;
  if (!email || !isOrganizationRole(role) || role === "owner") {
    return NextResponse.json({ error: "A valid email and admin/member role are required" }, { status: 400 });
  }
  const target = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "User must sign up before being added" }, { status: 404 });

  const existing = await db.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: target.id } },
    select: { role: true },
  });
  if (existing?.role === "owner") {
    return NextResponse.json({ error: "The organization owner cannot be reassigned here" }, { status: 403 });
  }
  const actorRole = await db.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
    select: { role: true },
  });
  if (actorRole?.role !== "owner" && existing?.role === "admin") {
    return NextResponse.json({ error: "Only the owner can change an administrator" }, { status: 403 });
  }

  const membership = existing
    ? await db.organizationMember.update({
        where: { organizationId_userId: { organizationId, userId: target.id } },
        data: { role },
      })
    : await db.organizationMember.create({
        data: { organizationId, userId: target.id, role },
      });
  return NextResponse.json(membership, { status: existing ? 200 : 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await params;
  const session = await auth();
  const user = await actor(session.userId);
  if (!user || !(await requireOrganizationManager(user.id, organizationId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await request.json().catch(() => null);
  const targetUserId = typeof body?.userId === "string" ? body.userId : "";
  const existing = await db.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: targetUserId } },
    select: { role: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.role === "owner") {
    return NextResponse.json({ error: "The organization owner cannot be removed" }, { status: 403 });
  }
  const actorRole = await db.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
    select: { role: true },
  });
  if (actorRole?.role !== "owner" && existing.role === "admin") {
    return NextResponse.json({ error: "Only the owner can remove an administrator" }, { status: 403 });
  }
  await db.$transaction([
    db.teamMember.deleteMany({ where: { userId: targetUserId, team: { organizationId } } }),
    db.organizationMember.delete({
      where: { organizationId_userId: { organizationId, userId: targetUserId } },
    }),
  ]);
  return NextResponse.json({ success: true });
}
