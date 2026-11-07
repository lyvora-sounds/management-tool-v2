import type { TaskModel } from "@/lib/generated/prisma/models/Task";
import type { ApiCreatedTask } from "./types";

/**
 * A ticket the API has just created, as the Prisma-shaped model the board screens use. Dates cross the wire as
 * ISO strings. The API never sends the share token or the calendar event id, so they are null here: a new ticket
 * has neither. Reading every field by name is what makes a change in the API's ticket fail the build.
 */
export function taskFromApi(task: ApiCreatedTask): TaskModel {
  const date = (value: string | null) => (value ? new Date(value) : null);
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    completed: task.completed,
    completedAt: date(task.completedAt),
    completedById: task.completedById,
    priority: task.priority,
    startDate: date(task.startDate),
    dueDate: date(task.dueDate),
    archived: task.archived,
    archivedAt: date(task.archivedAt),
    quarter: task.quarter,
    epicId: task.epicId,
    order: task.order,
    number: task.number,
    listId: task.listId,
    assigneeId: task.assigneeId,
    qaId: task.qaId,
    // OpenAPI CreatedTask gains reporterId when the API schema ships; until then new tickets still need the Prisma field.
    reporterId:
      "reporterId" in task
        ? ((task as ApiCreatedTask & { reporterId: string | null }).reporterId ?? null)
        : null,
    shareToken: null,
    googleEventId: null,
    createdAt: new Date(task.createdAt),
    updatedAt: new Date(task.updatedAt),
  };
}
