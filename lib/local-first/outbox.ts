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
 * A non-network HTTP error drops the row (server rejected; retrying would loop).
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
    if (response.ok || (response.status >= 400 && response.status < 500)) {
      await db.outbox.delete(row.id);
    } else {
      await db.outbox.update(row.id, { attempts: row.attempts + 1 });
    }
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
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        await db.outbox.delete(row.id);
        sent += 1;
      } else {
        await db.outbox.update(row.id, { attempts: row.attempts + 1 });
        failed += 1;
        break;
      }
    } catch {
      await db.outbox.update(row.id, { attempts: row.attempts + 1 });
      failed += 1;
      break;
    }
  }
  return { sent, failed };
}
