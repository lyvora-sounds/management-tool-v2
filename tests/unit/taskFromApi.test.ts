import { describe, expect, it } from "vitest";
import { taskFromApi } from "@/lib/api/tasks";
import type { ApiCreatedTask } from "@/lib/api/types";

const created: ApiCreatedTask = {
  id: "t1", title: "Ship it", description: null, completed: false, completedAt: null, completedById: null, priority: null,
  startDate: null, dueDate: "2026-12-01T00:00:00.000Z", archived: false, archivedAt: null, quarter: null, epicId: null,
  order: 3, listId: "l1", assigneeId: null, qaId: null, number: 12, createdAt: "2026-11-02T10:00:00.000Z", updatedAt: "2026-11-02T10:00:01.000Z",
};

describe("a ticket the API created, as the board screens hold it", () => {
  it("turns the dates into dates and keeps the rest by name, including the ticket number", () => {
    const task = taskFromApi(created);
    expect(task.createdAt).toEqual(new Date("2026-11-02T10:00:00.000Z"));
    expect(task.updatedAt).toBeInstanceOf(Date);
    expect(task.dueDate).toEqual(new Date("2026-12-01T00:00:00.000Z"));
    expect([task.startDate, task.completedAt, task.archivedAt]).toEqual([null, null, null]);
    expect(task).toMatchObject({ id: "t1", title: "Ship it", order: 3, number: 12, listId: "l1", priority: null });
  });

  it("has no share token or calendar event, because a new ticket has neither", () => {
    expect(taskFromApi(created)).toMatchObject({ shareToken: null, googleEventId: null });
  });
});
