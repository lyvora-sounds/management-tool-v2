import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Prisma } from "@/lib/generated/prisma/client";
import db from "@/lib/db";
import { requireOrganizationManager } from "@/lib/organizations";

async function actorId() {
  const { userId } = await auth();
  if (!userId) return null;
  return (await db.user.findUnique({ where: { clerkId: userId }, select: { id: true } }))?.id ?? null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await params;
  const userId = await actorId();
  if (!userId || !(await db.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
  }))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(await db.team.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
    include: { members: { select: { user: { select: { id: true, name: true, email: true } } } } },
  }));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await params;
  const userId = await actorId();
  if (!userId || !(await requireOrganizationManager(userId, organizationId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 80) return NextResponse.json({ error: "Invalid team name" }, { status: 400 });
  try {
    const team = await db.team.create({ data: { organizationId, name } });
    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "A team with that name already exists" }, { status: 409 });
    }
    throw error;
  }
}
