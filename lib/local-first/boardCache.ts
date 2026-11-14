import type { ListWithTasks } from "@/app/(routes)/(dashboard)/board/[boardId]/components/TaskCard/TaskCard.types";
import { getLocalFirstDb, type LocalFirstDb } from "./db";

export async function readBoardCache(
  boardId: string,
  db: LocalFirstDb = getLocalFirstDb(),
): Promise<ListWithTasks[] | null> {
  const row = await db.boardCache.get(boardId);
  return row?.lists ?? null;
}

export async function writeBoardCache(
  boardId: string,
  lists: ListWithTasks[],
  db: LocalFirstDb = getLocalFirstDb(),
): Promise<void> {
  await db.boardCache.put({ boardId, lists, updatedAt: Date.now() });
}

export async function deleteBoardCache(
  boardId: string,
  db: LocalFirstDb = getLocalFirstDb(),
): Promise<void> {
  await db.boardCache.delete(boardId);
}
