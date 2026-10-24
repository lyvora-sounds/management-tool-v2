import { describe, expect, it } from "vitest";
import { syncParentChildRelationships } from "@/lib/customValuesSync";

type ValueRow = { taskId: string; customFieldId: string; value: string | null };

function board(tasks: string[], values: ValueRow[] = []) {
  const onBoard = new Set(tasks);
  const rows = values.map((row) => ({ ...row }));
  const fields = [
    { id: "parent-field", boardId: "board", defaultKey: "parent" },
    { id: "child-field", boardId: "board", defaultKey: "child" },
  ];
  const tx = {
    task: {
      findFirst: async ({ where }: { where: { id: string; list: { boardId: string } } }) =>
        where.list.boardId === "board" && onBoard.has(where.id) ? { id: where.id } : null,
    },
    customField: {
      findFirst: async ({ where }: { where: { boardId: string; defaultKey: string } }) =>
        fields.find((field) => field.boardId === where.boardId && field.defaultKey === where.defaultKey) ?? null,
    },
    customFieldValue: {
      findUnique: async ({ where }: { where: { taskId_customFieldId: { taskId: string; customFieldId: string } } }) => {
        const key = where.taskId_customFieldId;
        return rows.find((row) => row.taskId === key.taskId && row.customFieldId === key.customFieldId) ?? null;
      },
      upsert: async ({
        where,
        update,
        create,
      }: {
        where: { taskId_customFieldId: { taskId: string; customFieldId: string } };
        update: { value: string | null };
        create: ValueRow;
      }) => {
        const key = where.taskId_customFieldId;
        const index = rows.findIndex((row) => row.taskId === key.taskId && row.customFieldId === key.customFieldId);
        if (index >= 0) rows[index] = { ...rows[index], value: update.value };
        else rows.push({ ...create });
      },
    },
  };
  const read = (taskId: string, fieldId: string) =>
    rows.find((row) => row.taskId === taskId && row.customFieldId === fieldId)?.value ?? null;
  return { tx, read };
}

const parent = { defaultKey: "parent" };
const child = { defaultKey: "child" };

describe("syncParentChildRelationships", () => {
  it("adds a second parent without removing the first parent's child link", async () => {
    const { tx, read } = board(
      ["current", "p1", "p2"],
      [{ taskId: "p1", customFieldId: "child-field", value: '["current"]' }],
    );
    await syncParentChildRelationships(tx as never, {
      boardId: "board",
      currentTaskId: "current",
      customField: parent,
      oldValue: "p1",
      newValue: '["p1","p2"]',
    });
    expect(read("p1", "child-field")).toBe('["current"]');
    expect(read("p2", "child-field")).toBe('["current"]');
  });

  it("removes only the parent that was cleared", async () => {
    const { tx, read } = board(
      ["current", "p1", "p2"],
      [
        { taskId: "p1", customFieldId: "child-field", value: '["current","other"]' },
        { taskId: "p2", customFieldId: "child-field", value: '["current"]' },
      ],
    );
    await syncParentChildRelationships(tx as never, {
      boardId: "board",
      currentTaskId: "current",
      customField: parent,
      oldValue: '["p1","p2"]',
      newValue: '["p1"]',
    });
    expect(read("p1", "child-field")).toBe('["current","other"]');
    expect(read("p2", "child-field")).toBe("");
  });

  it("appends the current ticket to a child's parent list", async () => {
    const { tx, read } = board(
      ["current", "c1", "other"],
      [{ taskId: "c1", customFieldId: "parent-field", value: "other" }],
    );
    await syncParentChildRelationships(tx as never, {
      boardId: "board",
      currentTaskId: "current",
      customField: child,
      oldValue: "",
      newValue: '["c1"]',
    });
    expect(read("c1", "parent-field")).toBe('["other","current"]');
    expect(read("other", "child-field")).toBeNull();
  });

  it("drops only the current ticket when a child is removed", async () => {
    const { tx, read } = board(
      ["current", "c1"],
      [{ taskId: "c1", customFieldId: "parent-field", value: '["current","other"]' }],
    );
    await syncParentChildRelationships(tx as never, {
      boardId: "board",
      currentTaskId: "current",
      customField: child,
      oldValue: '["c1"]',
      newValue: "",
    });
    expect(read("c1", "parent-field")).toBe('["other"]');
  });

  it("skips the ticket itself and tickets on another board", async () => {
    const { tx, read } = board(
      ["current", "p1"],
      [{ taskId: "p1", customFieldId: "child-field", value: "[]" }],
    );
    await syncParentChildRelationships(tx as never, {
      boardId: "board",
      currentTaskId: "current",
      customField: parent,
      oldValue: "",
      newValue: '["current","missing","p1"]',
    });
    expect(read("p1", "child-field")).toBe('["current"]');
    expect(read("missing", "child-field")).toBeNull();
    expect(read("current", "child-field")).toBeNull();
  });

  it("leaves unrelated fields untouched", async () => {
    const { tx, read } = board(["current"]);
    await syncParentChildRelationships(tx as never, {
      boardId: "board",
      currentTaskId: "current",
      customField: { defaultKey: "story_points" },
      oldValue: "1",
      newValue: "2",
    });
    expect(read("current", "parent-field")).toBeNull();
  });
});
