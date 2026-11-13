import { describe, expect, it, vi } from "vitest";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  parseStoryPoints,
  recordTaskStateTransition,
  recordTaskStateTransitions,
  toDurationMs,
} from "@/lib/transitions";

function buildMockTx(overrides?: {
  prior?: { transitionedAt: Date; toListTitle: string } | null;
  taskRow?: { createdAt: Date; assigneeId: string | null; list?: { title: string } } | null;
  storyPointsValue?: string | null;
}) {
  const create = vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
    id: "trans-1",
    ...data,
  }));
  const findFirst = vi.fn(async () => overrides?.prior ?? null);
  const findUnique = vi.fn(
    async () =>
      overrides?.taskRow ?? {
        createdAt: new Date("2026-10-01T10:00:00.000Z"),
        assigneeId: "user-assignee",
        list: { title: "To do" },
      },
  );
  const findMany = vi.fn(async () =>
    overrides?.storyPointsValue !== undefined
      ? overrides.storyPointsValue === null
        ? []
        : [{ value: overrides.storyPointsValue }]
      : [{ value: "5" }],
  );

  const tx = {
    taskStateTransition: { create, findFirst },
    task: { findUnique },
    customFieldValue: { findMany },
  } as unknown as Prisma.TransactionClient;

  return { tx, create, findFirst, findUnique, findMany };
}

describe("TaskStateTransition engine (ISO 27001 A.8.15 & A.8.32)", () => {
  it("parses story_points strings safely and converts BigInt durationMs", () => {
    expect(parseStoryPoints("5")).toBe(5);
    expect(parseStoryPoints(" 13 ")).toBe(13);
    expect(parseStoryPoints("")).toBeNull();
    expect(parseStoryPoints(null)).toBeNull();
    expect(parseStoryPoints("abc")).toBeNull();
    expect(toDurationMs(BigInt(3600000))).toBe(3600000);
    expect(toDurationMs(null)).toBeNull();
  });

  it("skips no-op moves where fromListId equals toListId", async () => {
    const { tx, create } = buildMockTx();
    const res = await recordTaskStateTransition(tx, {
      taskId: "task-1",
      boardId: "board-1",
      fromListId: "list-a",
      toListId: "list-a",
      toListTitle: "To do",
    });
    expect(res).toBeNull();
    expect(create).not.toHaveBeenCalled();
  });

  it("calculates dwell durationMs from prior transition and snapshots storyPointsAtMove", async () => {
    const enteredAt = new Date("2026-10-10T08:00:00.000Z");
    const movedAt = new Date("2026-10-10T10:30:00.000Z"); // 2.5 hours = 9_000_000 ms
    const { tx, create } = buildMockTx({
      prior: { transitionedAt: enteredAt, toListTitle: "In progress" },
      storyPointsValue: "8",
    });

    const record = await recordTaskStateTransition(tx, {
      taskId: "task-1",
      boardId: "board-1",
      fromListId: "list-ip",
      toListId: "list-done",
      toListTitle: "Done",
      movedById: "actor-1",
      assigneeIdAtMove: "user-1",
      transitionedAt: movedAt,
    });

    expect(create).toHaveBeenCalledOnce();
    expect(record).toMatchObject({
      taskId: "task-1",
      boardId: "board-1",
      fromListId: "list-ip",
      fromListTitle: "In progress",
      toListId: "list-done",
      toListTitle: "Done",
      movedById: "actor-1",
      assigneeIdAtMove: "user-1",
      storyPointsAtMove: 8,
      completedAfterMove: true,
      durationMs: BigInt(9_000_000),
      transitionedAt: movedAt,
    });
  });

  it("falls back to task createdAt on first move out of initial list", async () => {
    const createdAt = new Date("2026-10-01T00:00:00.000Z");
    const movedAt = new Date("2026-10-02T00:00:00.000Z"); // 86_400_000 ms
    const { tx } = buildMockTx({
      prior: null,
      taskRow: { createdAt, assigneeId: "user-2", list: { title: "To do" } },
      storyPointsValue: "3",
    });

    const record = await recordTaskStateTransition(tx, {
      taskId: "task-2",
      boardId: "board-1",
      fromListId: "list-todo",
      toListId: "list-ip",
      toListTitle: "In progress",
      movedById: "user-2",
      transitionedAt: movedAt,
    });

    expect(record).toMatchObject({
      fromListTitle: "To do",
      assigneeIdAtMove: "user-2",
      storyPointsAtMove: 3,
      completedAfterMove: false,
      durationMs: BigInt(86_400_000),
    });
  });

  it("records batch transitions in order via recordTaskStateTransitions", async () => {
    const { tx, create } = buildMockTx({ storyPointsValue: "5" });
    const results = await recordTaskStateTransitions(tx, [
      {
        taskId: "t1",
        boardId: "b1",
        fromListId: "l1",
        toListId: "l2",
        toListTitle: "In progress",
      },
      {
        taskId: "t2",
        boardId: "b1",
        fromListId: "l2",
        toListId: "l2",
        toListTitle: "In progress",
      },
    ]);
    expect(results).toHaveLength(1);
    expect(create).toHaveBeenCalledOnce();
  });
});
