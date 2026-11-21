import { describe, expect, it, vi } from "vitest";
import { decodeLogMessage, encodeLogMessage } from "@/lib/activityMessages";
import {
  buildTicketUrl,
  fallbackActivityReferences,
  resolveBoardActivityReferences,
} from "@/lib/activityReferences";

const T0 = new Date("2026-11-21T10:00:00.000Z");

describe("activityMessages with ticket refs", () => {
  it("omits r when refs are not supplied and parses valid r entries", () => {
    expect(JSON.parse(encodeLogMessage("activity.listCreated", { actor: "Ana", list: "Todo" }))).toEqual({
      k: "activity.listCreated",
      p: { actor: "Ana", list: "Todo" },
    });

    const encoded = encodeLogMessage(
      "activity.mcpTicketUpdated",
      { actor: "Ana", ticket: "Add links" },
      [{ taskId: "t1", ticketKey: "KI-00079", title: "Add links" }],
    );
    expect(decodeLogMessage(encoded)).toEqual({
      key: "activity.mcpTicketUpdated",
      params: { actor: "Ana", ticket: "Add links" },
      refs: [{ taskId: "t1", ticketKey: "KI-00079", title: "Add links" }],
    });
  });
});

describe("buildTicketUrl & fallbackActivityReferences", () => {
  it("builds canonical URLs when origin is valid and relative URLs otherwise", () => {
    expect(buildTicketUrl("https://kikiboard.xyz/dashboard", "b1", "t9")).toBe(
      "https://kikiboard.xyz/board/b1?taskId=t9",
    );
    expect(buildTicketUrl("", "b1", "t9")).toBe("/board/b1?taskId=t9");
  });

  it("extracts fallback references only when r is embedded in the message", () => {
    const encoded = encodeLogMessage(
      "activity.ticketCreated",
      { actor: "Ana", ticket: "Hello", list: "To do" },
      [{ taskId: "t1", ticketKey: "KI-00001", title: "Hello" }],
    );
    expect(fallbackActivityReferences("b1", encoded, "https://kikiboard.xyz")).toEqual([
      {
        taskId: "t1",
        ticketKey: "KI-00001",
        title: "Hello",
        url: "https://kikiboard.xyz/board/b1?taskId=t1",
      },
    ]);
    expect(fallbackActivityReferences("b1", "{}")).toEqual([]);
  });
});

describe("resolveBoardActivityReferences", () => {
  function mockStore({
    boards = [{ id: "b1", key: "KI" }],
    tasks = [],
    mcpChanges = [],
  }: {
    boards?: Array<{ id: string; key: string }>;
    tasks?: Array<{ id: string; title: string; number: number; list: { boardId: string } }>;
    mcpChanges?: Array<{ id: string; boardId: string; actorId: string; createdAt: Date; after: unknown }>;
  }) {
    return {
      board: { findMany: vi.fn(async () => boards) },
      task: { findMany: vi.fn(async () => tasks) },
      mcpChange: { findMany: vi.fn(async () => mcpChanges) },
    };
  }

  it("resolves explicit r refs with board key and omits deleted tickets", async () => {
    const store = mockStore({
      tasks: [{ id: "t1", title: "Live Title", number: 79, list: { boardId: "b1" } }],
    });
    const refs = await resolveBoardActivityReferences(
      [
        {
          id: "a1",
          boardId: "b1",
          type: "task_completed",
          message: encodeLogMessage(
            "activity.ticketCompleted",
            { actor: "Ana", ticket: "Old Title" },
            [
              { taskId: "t1", title: "Old Title" },
              { taskId: "t-gone", title: "Deleted" },
            ],
          ),
          userId: "u1",
          createdAt: T0,
        },
      ],
      "https://kikiboard.xyz",
      store,
    );
    expect(refs.get("a1")).toEqual([
      {
        taskId: "t1",
        ticketKey: "KI-00079",
        title: "Live Title",
        url: "https://kikiboard.xyz/board/b1?taskId=t1",
      },
    ]);
  });

  it("resolves unique legacy title matches across boards and backfills legacy mcp_change logs", async () => {
    const store = mockStore({
      boards: [
        { id: "b1", key: "KI" },
        { id: "b2", key: "LY" },
      ],
      tasks: [
        { id: "t1", title: "Legacy Title", number: 5, list: { boardId: "b1" } },
        { id: "t2", title: "MCP Edited", number: 9, list: { boardId: "b2" } },
      ],
      mcpChanges: [
        {
          id: "mc1",
          boardId: "b2",
          actorId: "u2",
          createdAt: new Date(T0.getTime() + 250),
          after: [{ id: "t2" }],
        },
      ],
    });
    const refs = await resolveBoardActivityReferences(
      [
        {
          id: "a-legacy",
          boardId: "b1",
          type: "task_moved",
          message: encodeLogMessage("activity.ticketMoved", {
            actor: "Ana",
            ticket: "Legacy Title",
            from: "To do",
            to: "Done",
          }),
          userId: "u1",
          createdAt: T0,
        },
        {
          id: "a-mcp",
          boardId: "b2",
          type: "mcp_change",
          message: encodeLogMessage("activity.mcpUpdated", { actor: "Mario", count: 1 }),
          userId: "u2",
          createdAt: T0,
        },
      ],
      "https://kikiboard.xyz",
      store,
    );
    expect(refs.get("a-legacy")).toEqual([
      {
        taskId: "t1",
        ticketKey: "KI-00005",
        title: "Legacy Title",
        url: "https://kikiboard.xyz/board/b1?taskId=t1",
      },
    ]);
    expect(refs.get("a-mcp")).toEqual([
      {
        taskId: "t2",
        ticketKey: "LY-00009",
        title: "MCP Edited",
        url: "https://kikiboard.xyz/board/b2?taskId=t2",
      },
    ]);
  });
});
