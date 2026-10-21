import type { TaskWithLabels } from "../TaskCard/TaskCard.types";
import type { BoardFiltersState } from "../BoardFilters/BoardFilters.types";

export function taskMatchesFilters(
  task: TaskWithLabels,
  filters: BoardFiltersState,
): boolean {
  // Archive Status
  const isArchived = Boolean(task.archived);
  if (filters.archiveStatus === "active" && isArchived) return false;
  if (filters.archiveStatus === "archived" && !isArchived) return false;


  // Status
  if (filters.status === "completed" && !task.completed) return false;
  if (filters.status === "pending" && task.completed) return false;

  // Quarter
  if (filters.quarter !== "all" && task.quarter !== filters.quarter) return false;

  // Epic
  if (filters.epicId !== "all" && task.epicId !== filters.epicId) return false;

  // Labels — task must have ALL selected labels
  if (filters.labelIds.length > 0) {
    const taskLabelIds = task.labels.map((l) => l.label.id);
    if (!filters.labelIds.every((id) => taskLabelIds.includes(id)))
      return false;
  }

  // Due date
  if (filters.dueDate !== "all") {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);

    if (filters.dueDate === "none") {
      if (task.dueDate) return false;
    } else if (filters.dueDate === "overdue") {
      if (!task.dueDate || new Date(task.dueDate) >= today) return false;
    } else if (filters.dueDate === "today") {
      if (!task.dueDate) return false;
      const due = new Date(task.dueDate);
      const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      if (dueDay.getTime() !== today.getTime()) return false;
    } else if (filters.dueDate === "week") {
      if (!task.dueDate) return false;
      const due = new Date(task.dueDate);
      if (due < today || due >= weekEnd) return false;
    }
  }
  // Member filter
  if (filters.memberId && filters.memberId !== "all") {
    if (filters.memberId === "unassigned") {
      const hasAssignee = Boolean(task.assigneeId || task.assignee);
      const hasCollabs = Boolean(task.collaborators && task.collaborators.length > 0);
      const hasQa = Boolean(task.qaId || task.qa);
      if (hasAssignee || hasCollabs || hasQa) return false;
    } else {
      const matchesAssignee =
        task.assigneeId === filters.memberId || task.assignee?.id === filters.memberId;
      const matchesCollab = task.collaborators?.some(
        (c) => c.user.id === filters.memberId,
      );
      const matchesQa =
        task.qaId === filters.memberId || task.qa?.id === filters.memberId;
      if (!matchesAssignee && !matchesCollab && !matchesQa) return false;
    }
  }

  return true;
}
