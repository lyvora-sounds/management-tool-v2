import { apiFetch } from "@/lib/apiClient";
import { getLocalFirstDb, type LocalFirstDb, type OutboxRow } from "./db";

export type OutboxMutation = {
  method: string;
  path: string;
  body: unknown;
};

export async function enqueueOutbox(
  mutation: OutboxMutation,
  db: LocalFirstDb = getLocalFirstDb(),
): Promise<OutboxRow> {
  const row: OutboxRow = {
    id: crypto.randomUUID(),
    method: mutation.method,
    path: mutation.path,
    body: JSON.stringify(mutation.body),
    createdAt: Date.now(),
    attempts: 0,
  };
  await db.outbox.put(row);
  return row;
}

/**
 * Persist then send. On network failure the row stays for a later flush.
 * Any HTTP response (including 4xx/5xx) drops the row so UI rollback cannot double-apply later.
 */
export async function enqueueAndSend(
  mutation: OutboxMutation,
  fetchImpl: typeof apiFetch = apiFetch,
  db: LocalFirstDb = getLocalFirstDb(),
): Promise<Response | null> {
  const row = await enqueueOutbox(mutation, db);
  try {
    const response = await fetchImpl(mutation.path, {
      method: mutation.method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mutation.body),
    });
    await db.outbox.delete(row.id);
    return response;
  } catch {
    await db.outbox.update(row.id, { attempts: row.attempts + 1 });
    return null;
  }
}

export async function flushOutbox(
  fetchImpl: typeof apiFetch = apiFetch,
  db: LocalFirstDb = getLocalFirstDb(),
): Promise<{ sent: number; failed: number }> {
  const pending = await db.outbox.orderBy("createdAt").toArray();
  let sent = 0;
  let failed = 0;
  for (const row of pending) {
    try {
      const response = await fetchImpl(row.path, {
        method: row.method,
        headers: { "Content-Type": "application/json" },
        body: row.body,
      });
      await db.outbox.delete(row.id);
      if (response.ok) sent += 1;
      else {
        // Dropped a permanently rejected write; continue so later rows can flush.
        failed += 1;
      }
    } catch {
      await db.outbox.update(row.id, { attempts: row.attempts + 1 });
      failed += 1;
      break;
    }
  }
  return { sent, failed };
}
