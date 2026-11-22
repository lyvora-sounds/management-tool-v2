import { describe, expect, it } from "vitest";
import { boardTaskFromApi, listsFromApi } from "@/lib/api/boardView";
import type { ApiBoardView, ApiBoardViewTask } from "@/lib/api/types";

const when = "2026-11-22T10:00:00.000Z";
const person = { id: "u1", name: "Ana", email: "ana@example.com" };

const task: ApiBoardViewTask = {
  id: "t1", number: 7, title: "Fix", description: null, completed: false, completedAt: null, completedById: null,
  priority: "high", startDate: null, dueDate: when, archived: false, archivedAt: null, quarter: null, epicId: "e1", order: 2, listId: "l1",
  assigneeId: "u1", qaId: null, reporterId: "u1", createdAt: when, updatedAt: when,
  labels: [{ taskId: "t1", labelId: "lb", label: { id: "lb", title: "bug", color: "#f00", boardId: "b1", createdAt: when, updatedAt: when } }],
  assignee: person, qa: null, reporter: person,
  collaborators: [{ taskId: "t1", userId: "u2", user: { id: "u2", name: null, email: "b@example.com" } }],
  subtasks: [{ completed: true }, { completed: false }],
  epic: { id: "e1", title: "Epic", color: "#0f0" },
  customValues: [{ id: "cv", taskId: "t1", customFieldId: "cf", value: "5", customField: { id: "cf", name: "Story points", type: "NUMBER", options: null, enabled: true, isDefault: true, defaultKey: "story_points", order: 0 } }],
  _count: { comments: 3, attachments: 1 },
};

describe("boardTaskFromApi", () => {
  it("builds the model the cards use, with dates as Date and no share token or event id", () => {
    const model = boardTaskFromApi(task);
    expect(model).toMatchObject({ id: "t1", number: 7, order: 2, reporterId: "u1", shareToken: null, googleEventId: null });
    expect(model.dueDate).toEqual(new Date(when));
    expect(model.startDate).toBeNull();
    expect(model.labels[0]!.label.createdAt).toEqual(new Date(when));
    expect(model.collaborators).toEqual([{ user: { id: "u2", name: null, email: "b@example.com" } }]);
    expect(model.customValues).toEqual([{ id: "cv", value: "5", customField: { name: "Story points", enabled: true, defaultKey: "story_points" } }]);
    expect(model._count).toEqual({ comments: 3, attachments: 1 });
    expect(model.subtasks).toHaveLength(2);
  });
});

describe("listsFromApi", () => {
  it("keeps the lists and their tickets in the order the API sent them", () => {
    const view = {
      lists: [
        { id: "l1", title: "Todo", order: 0, boardId: "b1", createdAt: when, updatedAt: when, tasks: [task, { ...task, id: "t2" }] },
        { id: "l2", title: "Done", order: 1, boardId: "b1", createdAt: when, updatedAt: when, tasks: [] },
      ],
    } as unknown as ApiBoardView;
    const lists = listsFromApi(view);
    expect(lists.map((l) => [l.id, l.tasks.map((t) => t.id)])).toEqual([["l1", ["t1", "t2"]], ["l2", []]]);
    expect(lists[0]!.createdAt).toEqual(new Date(when));
  });
});
