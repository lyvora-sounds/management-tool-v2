import { apiFetch } from "@/lib/apiClient";
import { getLocalFirstDb, type LocalFirstDb, type OutboxRow } from "./db";

export type OutboxMutation = {
  method: string;
  path: string;
  body: unknown;
};

function sendMutation(
  mutation: OutboxMutation,
  fetchImpl: typeof apiFetch,
): Promise<Response> {
  return fetchImpl(mutation.path, {
    method: mutation.method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mutation.body),
  });
}

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
 * Persist then send when IndexedDB works. If the DB cannot open or enqueue fails, fall back to a
 * direct fetch so a drag is never dropped solely because storage is unavailable.
 * On network failure (after a successful enqueue) the row stays for a later flush.
 * Any HTTP response drops the row so UI rollback cannot double-apply later.
 */
export async function enqueueAndSend(
  mutation: OutboxMutation,
  fetchImpl: typeof apiFetch = apiFetch,
  db: LocalFirstDb = getLocalFirstDb(),
): Promise<Response | null> {
  let row: OutboxRow;
  try {
    row = await enqueueOutbox(mutation, db);
  } catch {
    return sendMutation(mutation, fetchImpl);
  }

  try {
    const response = await sendMutation(mutation, fetchImpl);
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
      else failed += 1;
    } catch {
      await db.outbox.update(row.id, { attempts: row.attempts + 1 });
      failed += 1;
      break;
    }
  }
  return { sent, failed };
}
