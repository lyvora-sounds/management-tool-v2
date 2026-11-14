import "fake-indexeddb/auto";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createLocalFirstDb, type LocalFirstDb } from "@/lib/local-first/db";
import { readBoardCache, writeBoardCache } from "@/lib/local-first/boardCache";
import { enqueueAndSend, flushOutbox } from "@/lib/local-first/outbox";
import { consumeSseBuffer } from "@/lib/local-first/sse";

describe("consumeSseBuffer", () => {
  it("parses ready and domain frames and keeps a partial trailing frame", () => {
    const frames: { event: string; data: string; id?: string }[] = [];
    const rest = consumeSseBuffer(
      'event: ready\ndata: {"boardId":"b1"}\n\nid: e1\nevent: domain\ndata: {"type":"ticket.moved"}\n\nevent: domain\ndata: {"partial',
      (event, data, id) => frames.push({ event, data, id }),
    );
    expect(frames).toEqual([
      { event: "ready", data: '{"boardId":"b1"}', id: undefined },
      { event: "domain", data: '{"type":"ticket.moved"}', id: "e1" },
    ]);
    expect(rest).toBe('event: domain\ndata: {"partial');
  });

  it("ignores heartbeat comments", () => {
    const frames: string[] = [];
    consumeSseBuffer(": ping\n\n", (event) => frames.push(event));
    expect(frames).toEqual([]);
  });
});

describe("board cache + outbox", () => {
  let db: LocalFirstDb;

  beforeEach(async () => {
    db = createLocalFirstDb(`test-local-first-${crypto.randomUUID()}`);
    await db.open();
  });

  afterAll(async () => {
    /* databases are ephemeral per test name */
  });

  it("round-trips a board snapshot", async () => {
    const lists = [{ id: "l1", title: "Todo", order: 0, boardId: "b1", tasks: [] }] as never;
    await writeBoardCache("b1", lists, db);
    expect(await readBoardCache("b1", db)).toEqual(lists);
    await db.delete();
  });

  it("keeps the outbox row when the network fails, then flushes later", async () => {
    const failing = vi.fn(async () => {
      throw new Error("offline");
    });
    const result = await enqueueAndSend(
      { method: "PATCH", path: "/api/tasks/updateOrder", body: { items: [] } },
      failing as never,
      db,
    );
    expect(result).toBeNull();
    expect(await db.outbox.count()).toBe(1);

    const ok = vi.fn(async () => new Response(null, { status: 200 }));
    const flushed = await flushOutbox(ok as never, db);
    expect(flushed).toEqual({ sent: 1, failed: 0 });
    expect(await db.outbox.count()).toBe(0);
    expect(ok).toHaveBeenCalledOnce();
    await db.delete();
  });

  it("drops the outbox row on a 4xx so a rejected write is not retried forever", async () => {
    const reject = vi.fn(async () => new Response(JSON.stringify({ error: "forbidden" }), { status: 403 }));
    await enqueueAndSend(
      { method: "PATCH", path: "/api/tasks/updateOrder", body: { items: [] } },
      reject as never,
      db,
    );
    expect(await db.outbox.count()).toBe(0);
    await db.delete();
  });
});
