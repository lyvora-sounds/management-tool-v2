import { describe, expect, it } from "vitest";
import { taskMatchesFilters } from "@/app/(routes)/(dashboard)/board/[boardId]/components/BoardContent/taskMatchesFilters";
import { DEFAULT_FILTERS } from "@/app/(routes)/(dashboard)/board/[boardId]/components/BoardContent/BoardContent.constants";
import type { TaskWithLabels } from "@/app/(routes)/(dashboard)/board/[boardId]/components/TaskCard/TaskCard.types";

const task = (over: Partial<TaskWithLabels> = {}) =>
  ({ id: "t", archived: false, completed: false, labels: [], dueDate: null, quarter: null, epicId: null, assigneeId: null, assignee: null, qaId: null, qa: null, collaborators: [], ...over }) as unknown as TaskWithLabels;
const filters = (over: Partial<typeof DEFAULT_FILTERS> = {}) => ({ ...DEFAULT_FILTERS, ...over });

describe("taskMatchesFilters", () => {
  it("shows every active ticket with the default filters", () => {
    expect(taskMatchesFilters(task(), filters())).toBe(true);
  });
  it("filters by epic (regression: the epic filter did nothing)", () => {
    expect(taskMatchesFilters(task({ epicId: "e1" }), filters({ epicId: "e1" }))).toBe(true);
    expect(taskMatchesFilters(task({ epicId: "e2" }), filters({ epicId: "e1" }))).toBe(false);
    expect(taskMatchesFilters(task({ epicId: null }), filters({ epicId: "e1" }))).toBe(false);
  });
  it("filters by completion status", () => {
    expect(taskMatchesFilters(task({ completed: true }), filters({ status: "pending" }))).toBe(false);
    expect(taskMatchesFilters(task({ completed: false }), filters({ status: "pending" }))).toBe(true);
    expect(taskMatchesFilters(task({ completed: false }), filters({ status: "completed" }))).toBe(false);
    expect(taskMatchesFilters(task({ completed: true }), filters({ status: "completed" }))).toBe(true);
  });
  it("filters by quarter", () => {
    expect(taskMatchesFilters(task({ quarter: "2026-Q4" }), filters({ quarter: "2026-Q4" }))).toBe(true);
    expect(taskMatchesFilters(task({ quarter: "2026-Q3" }), filters({ quarter: "2026-Q4" }))).toBe(false);
  });
  it("filters by member as assignee, QA or collaborator, and by unassigned", () => {
    expect(taskMatchesFilters(task({ assigneeId: "u1" }), filters({ memberId: "u1" }))).toBe(true);
    expect(taskMatchesFilters(task({ qaId: "u1" }), filters({ memberId: "u1" }))).toBe(true);
    expect(taskMatchesFilters(task({ collaborators: [{ user: { id: "u1" } }] as never }), filters({ memberId: "u1" }))).toBe(true);
    expect(taskMatchesFilters(task({ assigneeId: "u2" }), filters({ memberId: "u1" }))).toBe(false);
    expect(taskMatchesFilters(task(), filters({ memberId: "unassigned" }))).toBe(true);
    expect(taskMatchesFilters(task({ assigneeId: "u1" }), filters({ memberId: "unassigned" }))).toBe(false);
  });
  it("combines filters and hides archived tickets by default", () => {
    expect(taskMatchesFilters(task({ epicId: "e1", completed: true }), filters({ epicId: "e1", status: "pending" }))).toBe(false);
    expect(taskMatchesFilters(task({ archived: true }), filters())).toBe(false);
    expect(taskMatchesFilters(task({ archived: true }), filters({ archiveStatus: "archived" }))).toBe(true);
  });
});
