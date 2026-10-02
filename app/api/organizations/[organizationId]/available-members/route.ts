import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireOrganizationManager } from "@/lib/organizations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await params;
  const { userId: clerkId } = await auth();
  const actor = clerkId
    ? await db.user.findUnique({ where: { clerkId }, select: { id: true } })
    : null;
  if (!actor || !(await requireOrganizationManager(actor.id, organizationId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sharedOrganizationIds = (await db.organizationMember.findMany({
    where: { userId: actor.id },
    select: { organizationId: true },
  })).map((membership) => membership.organizationId);
  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 100) ?? "";

  const people = await db.user.findMany({
    where: {
      organizationMembers: { some: { organizationId: { in: sharedOrganizationIds } } },
      NOT: { organizationMembers: { some: { organizationId } } },
      ...(query ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { email: { contains: query, mode: "insensitive" as const } },
          {
            organizationMembers: {
              some: {
                organizationId: { in: sharedOrganizationIds },
                organization: { name: { contains: query, mode: "insensitive" as const } },
              },
            },
          },
        ],
      } : {}),
    },
    orderBy: [{ name: "asc" }, { email: "asc" }],
    take: 50,
    select: {
      id: true,
      name: true,
      email: true,
      organizationMembers: {
        where: { organizationId: { in: sharedOrganizationIds } },
        select: { organization: { select: { id: true, name: true } } },
      },
    },
  });

  return NextResponse.json(people.map(({ organizationMembers, ...person }) => ({
    ...person,
    organizations: organizationMembers.map(({ organization }) => organization),
  })));
}
