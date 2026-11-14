import Dexie, { type EntityTable } from "dexie";
import type { ListWithTasks } from "@/app/(routes)/(dashboard)/board/[boardId]/components/TaskCard/TaskCard.types";

export type BoardCacheRow = {
  boardId: string;
  lists: ListWithTasks[];
  updatedAt: number;
};

export type OutboxRow = {
  id: string;
  method: string;
  path: string;
  body: string;
  createdAt: number;
  attempts: number;
};

export type LocalFirstDb = Dexie & {
  boardCache: EntityTable<BoardCacheRow, "boardId">;
  outbox: EntityTable<OutboxRow, "id">;
};

/** Browser IndexedDB for Strategy A: board snapshot cache + mutation outbox. */
export function createLocalFirstDb(name = "kikiboard-local-first"): LocalFirstDb {
  const db = new Dexie(name) as LocalFirstDb;
  db.version(1).stores({
    boardCache: "boardId, updatedAt",
    outbox: "id, createdAt",
  });
  return db;
}

let singleton: LocalFirstDb | null = null;

export function getLocalFirstDb(): LocalFirstDb {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is not available");
  }
  singleton ??= createLocalFirstDb();
  return singleton;
}

export async function clearLocalFirstDb(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = getLocalFirstDb();
  await Promise.all([db.boardCache.clear(), db.outbox.clear()]);
}
