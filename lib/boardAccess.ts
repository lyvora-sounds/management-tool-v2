import db from "@/lib/db";
import {
  type BoardRole,
  canEditBoard as roleCanEditBoard,
  canReadBoard as roleCanReadBoard,
  isBoardDefaultRole,
  normalizeRole,
} from "@/lib/boardRoles";

async function resolveUserId(userIdOrClerkId: string): Promise<string | null> {
  const user = await db.user.findFirst({
    where: { OR: [{ id: userIdOrClerkId }, { clerkId: userIdOrClerkId }] },
    select: { id: true },
  });
  return user?.id ?? null;
}

const roleRank: Record<BoardRole, number> = { viewer: 1, member: 2, admin: 3, owner: 4 };

function strongest(roles: BoardRole[]): BoardRole | null {
  return [...roles].sort((a, b) => roleRank[b] - roleRank[a])[0] ?? null;
}

/**
 * One board-access decision.
 *
 * Organization membership is the easy path: an organization-mode board is open
 * to every organization member at `defaultRole`. Restricted boards stay limited
 * to the owner, direct members, and team grants. Organization owners and admins
 * keep organization-level admin on every board in the organization, including
 * restricted ones.
 */
export type BoardAccessSnapshot = {
  ownerId: string;
  accessMode: string;
  defaultRole: string;
  directRole: string | null;
  organizationRole: string | null;
  teamRoles: string[];
};

export function resolveBoardRole(userId: string, board: BoardAccessSnapshot): BoardRole | null {
  if (board.ownerId === userId) return "owner";

  if (board.organizationRole === "owner" || board.organizationRole === "admin") return "admin";

  const roles: BoardRole[] = [];
  if (board.directRole) roles.push(normalizeRole(board.directRole));
  if (board.organizationRole) {
    for (const role of board.teamRoles) roles.push(normalizeRole(role));
  }
  if (board.organizationRole && board.accessMode === "organization" && isBoardDefaultRole(board.defaultRole)) {
    roles.push(board.defaultRole);
  }
  return strongest(roles);
}

/** Prisma filter for every board a user may read. Keep this aligned with resolveBoardRole. */
export function readableBoardWhere(userId: string) {
  return {
    OR: [
      { userId },
      { members: { some: { userId } } },
      { organization: { members: { some: { userId, role: { in: ["owner", "admin"] } } } } },
      {
        accessMode: "organization",
        defaultRole: { in: ["viewer", "member"] },
        organization: { members: { some: { userId } } },
      },
      {
        AND: [
          { organization: { members: { some: { userId } } } },
          { teamAccess: { some: { team: { members: { some: { userId } } } } } },
        ],
      },
    ],
  };
}

export async function getBoardRole(
  userIdOrClerkId: string,
  boardId: string,
): Promise<BoardRole | null> {
  const userId = await resolveUserId(userIdOrClerkId);
  if (!userId) return null;

  const board = await db.board.findUnique({
    where: { id: boardId },
    select: {
      userId: true,
      accessMode: true,
      defaultRole: true,
      members: { where: { userId }, select: { role: true }, take: 1 },
      organization: {
        select: { members: { where: { userId }, select: { role: true }, take: 1 } },
      },
      teamAccess: {
        where: { team: { members: { some: { userId } } } },
        select: { role: true },
      },
    },
  });

  if (!board) return null;
  return resolveBoardRole(userId, {
    ownerId: board.userId,
    accessMode: board.accessMode,
    defaultRole: board.defaultRole,
    directRole: board.members[0]?.role ?? null,
    organizationRole: board.organization?.members[0]?.role ?? null,
    teamRoles: board.teamAccess.map((grant) => grant.role),
  });
}

export async function canReadBoard(userIdOrClerkId: string, boardId: string) {
  return roleCanReadBoard(await getBoardRole(userIdOrClerkId, boardId));
}

export async function canEditBoard(userIdOrClerkId: string, boardId: string) {
  return roleCanEditBoard(await getBoardRole(userIdOrClerkId, boardId));
}

export async function isBoardOwner(userIdOrClerkId: string, boardId: string) {
  return (await getBoardRole(userIdOrClerkId, boardId)) === "owner";
}

export async function isBoardAdmin(userIdOrClerkId: string, boardId: string) {
  const role = await getBoardRole(userIdOrClerkId, boardId);
  return role === "owner" || role === "admin";
}
