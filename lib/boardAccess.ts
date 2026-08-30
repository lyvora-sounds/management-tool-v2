import db from "@/lib/db";
import { BoardRole, normalizeRole } from "@/lib/boardRoles";

async function resolveUserId(userIdOrClerkId: string): Promise<string | null> {
  const user = await db.user.findFirst({
    where: {
      OR: [{ id: userIdOrClerkId }, { clerkId: userIdOrClerkId }],
    },
    select: { id: true },
  });
  return user?.id ?? null;
}

/**
 * Check if a user (by DB id or Clerk ID) has access to a board (owner or member).
 */
export async function hasBoardAccess(
  userIdOrClerkId: string,
  boardId: string,
): Promise<boolean> {
  const userId = await resolveUserId(userIdOrClerkId);
  if (!userId) return false;

  const board = await db.board.findFirst({
    where: {
      id: boardId,
      OR: [{ userId }, { members: { some: { userId } } }],
    },
    select: { id: true },
  });
  return Boolean(board);
}

export const canAccessBoard = hasBoardAccess;

/**
 * Check if a user is the owner of a board.
 */
export async function isBoardOwner(
  userIdOrClerkId: string,
  boardId: string,
): Promise<boolean> {
  const userId = await resolveUserId(userIdOrClerkId);
  if (!userId) return false;

  const board = await db.board.findFirst({
    where: { id: boardId, userId },
    select: { id: true },
  });
  return Boolean(board);
}

/**
 * Rol efectivo de un usuario en un board, o null si no tiene acceso.
 * Es la primitiva sobre la que se apoyan el resto de comprobaciones: devuelve
 * el rol en lugar de un booleano para que las rutas puedan decidir con matiz.
 */
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
      members: {
        where: { userId },
        select: { role: true },
        take: 1,
      },
    },
  });

  if (!board) return null;
  if (board.userId === userId) return "owner";

  const membership = board.members[0];
  if (!membership) return null;

  return normalizeRole(membership.role);
}

/**
 * Check if a user is an admin or owner of a board.
 */
export async function isBoardAdmin(
  userIdOrClerkId: string,
  boardId: string,
): Promise<boolean> {
  const role = await getBoardRole(userIdOrClerkId, boardId);
  return role === "owner" || role === "admin";
}
