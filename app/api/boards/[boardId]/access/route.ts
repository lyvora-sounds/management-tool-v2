import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { isBoardAdmin } from "@/lib/boardAccess";
import { isAssignableRole, isBoardAccessMode, isBoardDefaultRole } from "@/lib/boardRoles";
import { canManageOrganization } from "@/lib/organizations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await params;
  const { userId } = await auth();
  if (!userId || !(await isBoardAdmin(userId, boardId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const board = await db.board.findUnique({
    where: { id: boardId },
    select: {
      accessMode: true,
      defaultRole: true,
      organization: {
        select: {
          id: true,
          name: true,
          teams: { orderBy: { name: "asc" }, select: { id: true, name: true } },
        },
      },
      teamAccess: { select: { teamId: true, role: true } },
    },
  });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const actor = await db.user.findFirst({
    where: { OR: [{ id: userId }, { clerkId: userId }] },
    select: { id: true },
  });
  const membership = actor
    ? await db.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId: board.organization.id, userId: actor.id } },
        select: { role: true },
      })
    : null;
  return NextResponse.json({
    ...board,
    canCreateTeam: canManageOrganization(membership?.role),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await params;
  const { userId } = await auth();
  if (!userId || !(await isBoardAdmin(userId, boardId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const board = await db.board.findUnique({ where: { id: boardId }, select: { organizationId: true } });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await request.json().catch(() => null);
  const accessMode = body?.accessMode;
  const defaultRole = body?.defaultRole;
  const grants = Array.isArray(body?.teamGrants) ? body.teamGrants : [];
  if (!isBoardAccessMode(accessMode) || !isBoardDefaultRole(defaultRole)) {
    return NextResponse.json({ error: "Invalid board access policy" }, { status: 400 });
  }
  if (grants.some((grant: unknown) => {
    if (!grant || typeof grant !== "object") return true;
    const value = grant as Record<string, unknown>;
    return typeof value.teamId !== "string" || !isAssignableRole(value.role);
  })) return NextResponse.json({ error: "Invalid team grant" }, { status: 400 });

  const teamIds = grants.map((grant: { teamId: string }) => grant.teamId);
  const validTeams = await db.team.count({ where: { id: { in: teamIds }, organizationId: board.organizationId } });
  if (validTeams !== new Set(teamIds).size) {
    return NextResponse.json({ error: "A team belongs to another organization" }, { status: 400 });
  }
  await db.$transaction(async (tx) => {
    await tx.board.update({ where: { id: boardId }, data: { accessMode, defaultRole } });
    await tx.boardTeamAccess.deleteMany({ where: { boardId } });
    if (grants.length) {
      await tx.boardTeamAccess.createMany({
        data: grants.map((grant: { teamId: string; role: string }) => ({ boardId, ...grant })),
      });
    }
  });
  return NextResponse.json({ accessMode, defaultRole, teamGrants: grants });
}
