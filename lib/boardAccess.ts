import db from "@/lib/db";

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
 * Check if a user is an admin or owner of a board.
 */
export async function isBoardAdmin(
  userIdOrClerkId: string,
  boardId: string,
): Promise<boolean> {
  const userId = await resolveUserId(userIdOrClerkId);
  if (!userId) return false;

  const board = await db.board.findFirst({
    where: {
      id: boardId,
      OR: [
        { userId },
        {
          members: {
            some: {
              userId,
              role: { in: ["admin", "owner"] },
            },
          },
        },
      ],
    },
    select: { id: true },
  });
  return Boolean(board);
}
