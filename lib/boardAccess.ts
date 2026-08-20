import db from "@/lib/db";

/**
 * Check if a user (by DB id or Clerk ID) has access to a board (owner or member).
 */
export async function hasBoardAccess(
  userIdOrClerkId: string,
  boardId: string,
): Promise<boolean> {
  const user = await db.user.findFirst({
    where: {
      OR: [{ id: userIdOrClerkId }, { clerkId: userIdOrClerkId }],
    },
    select: { id: true },
  });

  if (!user) return false;
  const userId = user.id;

  const board = await db.board.findFirst({
    where: {
      id: boardId,
      OR: [{ userId }, { members: { some: { userId } } }],
    },
    select: { id: true },
  });
  return !!board;
}

export const canAccessBoard = hasBoardAccess;

/**
 * Check if a user is the owner of a board.
 */
export async function isBoardOwner(
  userIdOrClerkId: string,
  boardId: string,
): Promise<boolean> {
  const user = await db.user.findFirst({
    where: {
      OR: [{ id: userIdOrClerkId }, { clerkId: userIdOrClerkId }],
    },
    select: { id: true },
  });

  if (!user) return false;

  const board = await db.board.findFirst({
    where: { id: boardId, userId: user.id },
    select: { id: true },
  });
  return !!board;
}
