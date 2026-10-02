import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getOrCreateUser } from "@/lib/getOrCreateUser";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json([]);

  const memberships = await db.organizationMember.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: {
      role: true,
      organization: {
        select: {
          id: true,
          name: true,
          description: true,
          boards: {
            orderBy: { createdAt: "asc" },
            select: { id: true, title: true, color: true, userId: true },
          },
          _count: { select: { boards: true, members: true, teams: true } },
        },
      },
    },
  });
  return NextResponse.json(memberships.map(({ role, organization }) => ({
    ...organization,
    boards: organization.boards.map(({ userId: ownerId, ...board }) => ({
      ...board,
      canMove: ownerId === user.id,
    })),
    role,
  })));
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await getOrCreateUser(userId);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 100) {
    return NextResponse.json({ error: "Name must contain 1 to 100 characters" }, { status: 400 });
  }
  const organization = await db.organization.create({
    data: {
      name,
      description: typeof body?.description === "string" ? body.description.trim() || null : null,
      createdById: user.id,
      members: { create: { userId: user.id, role: "owner" } },
    },
  });
  return NextResponse.json(organization, { status: 201 });
}
