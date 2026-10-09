import { randomUUID } from "node:crypto";
import { put, del } from "@vercel/blob";
import type { Prisma } from "@/lib/generated/prisma/client";
import { canReadBoard, isBoardAdmin } from "@/lib/boardAccess";
import { encodeLogMessage } from "@/lib/activityMessages";
import { syncParentChildRelationships } from "@/lib/customValuesSync";
import { isParentFieldKey, isTicketRefKey } from "@/lib/customFieldsDefaults";
import { parseListValue } from "@/lib/customValueUtils";
import { McpWriteError, type Snapshot } from "./writes";

export const relationSelect = {
  collaborators: { orderBy: { userId: "asc" }, select: { userId: true } },
  labels: { orderBy: { labelId: "asc" }, select: { labelId: true } },
  customValues: { orderBy: { customFieldId: "asc" }, select: { customFieldId: true, value: true } },
  subtasks: { orderBy: [{ order: "asc" }, { id: "asc" }], select: { id: true, title: true, completed: true, order: true, createdAt: true } },
  comments: { orderBy: [{ createdAt: "asc" }, { id: "asc" }], select: { id: true, content: true, userId: true, createdAt: true, updatedAt: true } },
  attachments: { orderBy: { id: "asc" }, select: { id: true, filename: true, url: true, size: true, createdAt: true } },
} satisfies Prisma.TaskSelect;
type RelationPatch = {
  collaboratorIds?: string[]; labelIds?: string[];
  customFields?: { customFieldId: string; value: string | null }[];
  subtasks?: { id?: string; title: string; completed: boolean; order: number }[];
  comments?: { id?: string; content?: string; delete?: boolean }[];
  attachments?: { id?: string; filename?: string; contentBase64?: string; delete?: boolean }[];
  shared?: boolean;
};
export const relationSchema = {
  collaboratorIds: { type: "array", maxItems: 100, uniqueItems: true, items: { type: "string" } },
  labelIds: { type: "array", maxItems: 100, uniqueItems: true, items: { type: "string" } },
  customFields: { type: "array", maxItems: 100, items: { type: "object", additionalProperties: false, required: ["customFieldId", "value"], properties: { customFieldId: { type: "string" }, value: { type: ["string", "null"], maxLength: 50000 } } } },
  subtasks: { description: "Replace the checklist. Preserve IDs for existing entries; omitted entries are removed.", type: "array", maxItems: 200, items: { type: "object", additionalProperties: false, required: ["title", "completed", "order"], properties: { id: { type: "string" }, title: { type: "string", maxLength: 500 }, completed: { type: "boolean" }, order: { type: "integer", minimum: 0 } } } },
  comments: { description: "Add comments without an ID; edit or delete existing comments by ID. Authors or board admins can modify existing comments.", type: "array", maxItems: 100, items: { type: "object", additionalProperties: false, properties: { id: { type: "string" }, content: { type: "string", maxLength: 50000 }, delete: { type: "boolean" } } } },
  attachments: { description: "Upload a file using filename and contentBase64 (up to 5 MiB); rename or remove an existing attachment by ID. Removed blobs remain available for revert.", type: "array", maxItems: 20, items: { type: "object", additionalProperties: false, properties: { id: { type: "string" }, filename: { type: "string", maxLength: 255 }, contentBase64: { type: "string", maxLength: 6990508 }, delete: { type: "boolean" } } } },
  shared: { type: "boolean", description: "Enable or revoke the public share link. The server generates the token." },
} as const;
function id(value: unknown): value is string { return typeof value === "string" && !!value.trim() && value.length <= 200; }
function rows(value: unknown, max: number): Record<string, unknown>[] {
  if (!Array.isArray(value) || value.length > max || value.some(row => !row || typeof row !== "object" || Array.isArray(row))) throw new McpWriteError("Invalid relation changes");
  return value;
}
function keys(row: Record<string, unknown>, allowed: string[]) {
  if (Object.keys(row).some(key => !allowed.includes(key))) throw new McpWriteError("Unsupported relation field");
}
function unique(values: unknown[]) { if (new Set(values).size !== values.length) throw new McpWriteError("Duplicate relation IDs"); }
export function parseRelationPatch(input: Record<string, unknown>): RelationPatch {
  const result: RelationPatch = {};
  for (const key of ["collaboratorIds", "labelIds"] as const) if (input[key] !== undefined) {
    const value = input[key];
    if (!Array.isArray(value) || value.length > 100 || !value.every(id)) throw new McpWriteError(`Invalid ${key}`);
    unique(value); result[key] = value;
  }
  if (input.shared !== undefined) {
    if (typeof input.shared !== "boolean") throw new McpWriteError("Invalid shared");
    result.shared = input.shared;
  }
  if (input.customFields !== undefined) {
    result.customFields = rows(input.customFields, 100).map(row => {
      keys(row, ["customFieldId", "value"]);
      if (!id(row.customFieldId) || (row.value !== null && (typeof row.value !== "string" || row.value.length > 50000))) throw new McpWriteError("Invalid custom field value");
      return { customFieldId: row.customFieldId, value: row.value as string | null };
    }); unique(result.customFields.map(row => row.customFieldId));
  }
  if (input.subtasks !== undefined) {
    result.subtasks = rows(input.subtasks, 200).map(row => {
      keys(row, ["id", "title", "completed", "order"]);
      if ((row.id !== undefined && !id(row.id)) || typeof row.title !== "string" || !row.title.trim() || row.title.length > 500 || typeof row.completed !== "boolean" || !Number.isSafeInteger(row.order) || (row.order as number) < 0) throw new McpWriteError("Invalid subtask");
      return { id: row.id as string | undefined, title: row.title.trim(), completed: row.completed, order: row.order as number };
    }); unique(result.subtasks.filter(row => row.id).map(row => row.id));
  }
  if (input.comments !== undefined) {
    result.comments = rows(input.comments, 100).map(row => {
      keys(row, ["id", "content", "delete"]);
      if ((row.id !== undefined && !id(row.id)) || (row.delete !== undefined && typeof row.delete !== "boolean") || (row.delete === true ? !id(row.id) || row.content !== undefined : typeof row.content !== "string" || !row.content.trim() || row.content.length > 50000)) throw new McpWriteError("Invalid comment");
      return { id: row.id as string | undefined, content: typeof row.content === "string" ? row.content.trim() : undefined, delete: row.delete as boolean | undefined };
    }); unique(result.comments.filter(row => row.id).map(row => row.id));
  }
  if (input.attachments !== undefined) {
    result.attachments = rows(input.attachments, 20).map(row => {
      keys(row, ["id", "filename", "contentBase64", "delete"]);
      if ((row.id !== undefined && !id(row.id)) || (row.delete !== undefined && typeof row.delete !== "boolean")) throw new McpWriteError("Invalid attachment");
      if (row.delete === true) {
        if (!id(row.id) || row.filename !== undefined || row.contentBase64 !== undefined) throw new McpWriteError("Invalid attachment deletion");
      } else {
        if (typeof row.filename !== "string" || !row.filename.trim() || row.filename.length > 255 || /[\\/\x00-\x1f]/.test(row.filename)) throw new McpWriteError("Invalid attachment filename");
        if (row.id === undefined) {
          if (typeof row.contentBase64 !== "string" || row.contentBase64.length > 6990508 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(row.contentBase64) || Buffer.from(row.contentBase64, "base64").length > 5 * 1024 * 1024) throw new McpWriteError("Invalid attachment content (maximum 5 MiB)");
        } else if (row.contentBase64 !== undefined) throw new McpWriteError("Upload a new attachment to replace file content");
      }
      return row as NonNullable<RelationPatch["attachments"]>[number];
    }); unique(result.attachments.filter(row => row.id).map(row => row.id));
  }
  return result;
}

type Actor = { id: string; name: string };
type State = Prisma.TaskGetPayload<{ select: typeof relationSelect }> & { id: string; title: string; assigneeId: string | null; qaId: string | null; shareToken: string | null };
type Patch = RelationPatch & { assigneeId?: string | null; qaId?: string | null; epicId?: string | null };
export async function validateTicketRelations(tx: Prisma.TransactionClient, boardId: string, actor: Actor, patch: Patch) {
  const { collaboratorIds, labelIds, customFields, subtasks, comments, attachments, shared, ...scalar } = patch;
  if (patch.assigneeId !== undefined || patch.qaId !== undefined || collaboratorIds !== undefined) {
    const board = await tx.board.findUnique({ where: { id: boardId }, select: { memberCanAssign: true } });
    if (!board || (!board.memberCanAssign && !(await isBoardAdmin(actor.id, boardId)))) throw new McpWriteError("No permission to assign people on this board");
    for (const userId of new Set([patch.assigneeId, patch.qaId, ...(collaboratorIds ?? [])].filter((value): value is string => !!value))) {
      if (!(await canReadBoard(userId, boardId))) throw new McpWriteError("Assigned people must have access to this board");
    }
  }
  if (patch.epicId && !(await tx.epic.findFirst({ where: { id: patch.epicId, boardId }, select: { id: true } }))) throw new McpWriteError("Epic must belong to the same board");
  if (labelIds && (await tx.label.count({ where: { id: { in: labelIds }, boardId } })) !== labelIds.length) throw new McpWriteError("Labels must belong to the same board");
  // All other relation validation occurs before its write, inside the same transaction.
  void customFields; void subtasks; void comments; void attachments; void shared;
  return scalar;
}
async function notify(tx: Prisma.TransactionClient, boardId: string, actor: Actor, task: State, userId: string, type: string, key: string) {
  if (userId !== actor.id) await tx.notification.create({ data: { userId, boardId, taskId: task.id, type, message: encodeLogMessage(key, { actor: actor.name, ticket: task.title }) } });
}
export async function applyTicketRelations(tx: Prisma.TransactionClient, boardId: string, actor: Actor, task: State, patch: Patch, capture: (id: string) => Promise<void>, uploaded: string[] = []) {
  for (const [field, type, key] of [["assigneeId", "assigned", "notifications.assignedYou"], ["qaId", "qa_assigned", "notifications.assignedYouQa"]] as const) {
    if (patch[field] && patch[field] !== task[field]) await notify(tx, boardId, actor, task, patch[field], type, key);
  }
  if (patch.shared !== undefined) await tx.task.update({ where: { id: task.id }, data: { shareToken: patch.shared ? task.shareToken ?? randomUUID() : null } });
  if (patch.collaboratorIds !== undefined) {
    for (const userId of patch.collaboratorIds) if (!task.collaborators.some(row => row.userId === userId)) await notify(tx, boardId, actor, task, userId, "collaborator_added", "notifications.addedYouCollaborator");
    await tx.taskCollaborator.deleteMany({ where: { taskId: task.id } });
    await tx.taskCollaborator.createMany({ data: patch.collaboratorIds.map(userId => ({ taskId: task.id, userId })) });
  }
  if (patch.labelIds !== undefined) {
    await tx.taskLabel.deleteMany({ where: { taskId: task.id } });
    await tx.taskLabel.createMany({ data: patch.labelIds.map(labelId => ({ taskId: task.id, labelId })) });
  }
  for (const row of patch.customFields ?? []) {
    const field = await tx.customField.findFirst({ where: { id: row.customFieldId, boardId, enabled: true } });
    if (!field) throw new McpWriteError("Custom field not found or disabled on this board");
    if (row.value !== null && row.value !== "") {
      if (field.type === "NUMBER" && (!row.value.trim() || !Number.isFinite(Number(row.value)))) throw new McpWriteError("Custom field requires a number");
      if (field.type === "SELECT" && (!Array.isArray(field.options) || !field.options.includes(row.value))) throw new McpWriteError("Custom field value must match an available option");
    }
    const oldValue = (await tx.customFieldValue.findUnique({ where: { taskId_customFieldId: { taskId: task.id, customFieldId: field.id } } }))?.value ?? null;
    if (isTicketRefKey(field.defaultKey)) {
      const newIds = isParentFieldKey(field.defaultKey) ? row.value ? [row.value] : [] : parseListValue(row.value);
      if (newIds.includes(task.id) || new Set(newIds).size !== newIds.length) throw new McpWriteError("Invalid ticket references");
      if ((await tx.task.count({ where: { id: { in: newIds }, list: { boardId } } })) !== newIds.length) throw new McpWriteError("Referenced tickets must belong to the same board");
      const oldIds = isParentFieldKey(field.defaultKey) ? oldValue ? [oldValue] : [] : parseListValue(oldValue);
      for (const relatedId of new Set([...oldIds, ...newIds])) {
        const related = await tx.task.findFirst({ where: { id: relatedId, list: { boardId } }, select: { id: true, customValues: { where: { customField: { defaultKey: "parent" } }, select: { value: true } } } });
        if (!related) continue;
        await capture(relatedId);
        if (!isParentFieldKey(field.defaultKey)) for (const value of related.customValues) if (value.value) await capture(value.value);
      }
    }
    await tx.customFieldValue.upsert({ where: { taskId_customFieldId: { taskId: task.id, customFieldId: field.id } }, update: { value: row.value }, create: { taskId: task.id, customFieldId: field.id, value: row.value } });
    await syncParentChildRelationships(tx, { boardId, currentTaskId: task.id, customField: field, oldValue, newValue: row.value });
  }
  if (patch.subtasks !== undefined) {
    for (const row of patch.subtasks) if (row.id && !task.subtasks.some(existing => existing.id === row.id)) throw new McpWriteError("Subtask does not belong to this ticket");
    await tx.subtask.deleteMany({ where: { taskId: task.id, id: { notIn: patch.subtasks.flatMap(row => row.id ? [row.id] : []) } } });
    for (const row of patch.subtasks) {
      if (row.id) await tx.subtask.update({ where: { id: row.id }, data: { title: row.title, completed: row.completed, order: row.order } });
      else await tx.subtask.create({ data: { taskId: task.id, title: row.title, completed: row.completed, order: row.order } });
    }
  }
  for (const row of patch.comments ?? []) {
    if (row.id) {
      const existing = task.comments.find(comment => comment.id === row.id);
      if (!existing || (existing.userId !== actor.id && !(await isBoardAdmin(actor.id, boardId)))) throw new McpWriteError("No permission to modify this comment");
      if (row.delete) await tx.comment.delete({ where: { id: row.id } });
      else await tx.comment.update({ where: { id: row.id }, data: { content: row.content! } });
    } else {
      await tx.comment.create({ data: { taskId: task.id, userId: actor.id, content: row.content! } });
      for (const userId of new Set([patch.assigneeId === undefined ? task.assigneeId : patch.assigneeId, patch.qaId === undefined ? task.qaId : patch.qaId, ...(patch.collaboratorIds ?? task.collaborators.map(c => c.userId))])) if (userId) await notify(tx, boardId, actor, task, userId, "comment", "notifications.commented");
    }
  }
  for (const row of patch.attachments ?? []) {
    if (row.id) {
      if (!task.attachments.some(existing => existing.id === row.id)) throw new McpWriteError("Attachment does not belong to this ticket");
      if (row.delete) await tx.attachment.delete({ where: { id: row.id } });
      else await tx.attachment.update({ where: { id: row.id }, data: { filename: row.filename! } });
    } else {
      const bytes = Buffer.from(row.contentBase64!, "base64");
      const blob = await put(`attachments/${task.id}/${row.filename}`, bytes, { access: "private", addRandomSuffix: true });
      uploaded.push(blob.url);
      await tx.attachment.create({ data: { taskId: task.id, filename: row.filename!, url: blob.url, size: bytes.length } });
    }
  }
}

export async function restoreTicketRelations(tx: Prisma.TransactionClient, boardId: string, actor: Actor, current: State, previous: Snapshot) {
  if (previous.assigneeId === undefined) return; // Journal from the original MCP version.
  const collaboratorIds = previous.collaborators.map(row => row.userId);
  const collaboratorsChanged = collaboratorIds.length !== current.collaborators.length ||
    current.collaborators.some(row => !collaboratorIds.includes(row.userId));
  await validateTicketRelations(tx, boardId, actor, {
    ...(previous.assigneeId !== current.assigneeId ? { assigneeId: previous.assigneeId } : {}),
    ...(previous.qaId !== current.qaId ? { qaId: previous.qaId } : {}),
    ...(collaboratorsChanged ? { collaboratorIds } : {}),
    epicId: previous.epicId, labelIds: previous.labels.map(row => row.labelId),
  });
  for (const comment of previous.comments) {
    const now = current.comments.find(row => row.id === comment.id);
    if ((!now || now.content !== comment.content) && comment.userId !== actor.id && !(await isBoardAdmin(actor.id, boardId))) throw new McpWriteError("No permission to restore another author's comment");
  }
  for (const comment of current.comments) {
    const old = previous.comments.find(row => row.id === comment.id);
    if ((!old || old.content !== comment.content) && comment.userId !== actor.id && !(await isBoardAdmin(actor.id, boardId))) throw new McpWriteError("No permission to revert another author's comment");
  }
  if (collaboratorsChanged) {
    for (const row of previous.collaborators) if (!current.collaborators.some(now => now.userId === row.userId)) await notify(tx, boardId, actor, current, row.userId, "collaborator_added", "notifications.addedYouCollaborator");
    await tx.taskCollaborator.deleteMany({ where: { taskId: current.id } });
    await tx.taskCollaborator.createMany({ data: previous.collaborators.map(row => ({ ...row, taskId: current.id })) });
  }
  await tx.taskLabel.deleteMany({ where: { taskId: current.id } });
  await tx.taskLabel.createMany({ data: previous.labels.map(row => ({ ...row, taskId: current.id })) });
  await tx.customFieldValue.deleteMany({ where: { taskId: current.id } });
  await tx.customFieldValue.createMany({ data: previous.customValues.map(row => ({ ...row, taskId: current.id })) });
  await tx.subtask.deleteMany({ where: { taskId: current.id } });
  await tx.subtask.createMany({ data: previous.subtasks.map(row => ({ ...row, createdAt: new Date(row.createdAt), taskId: current.id })) });
  await tx.comment.deleteMany({ where: { taskId: current.id } });
  await tx.comment.createMany({ data: previous.comments.map(row => ({ ...row, taskId: current.id, createdAt: new Date(row.createdAt), updatedAt: new Date(row.updatedAt) })) });
  await tx.attachment.deleteMany({ where: { taskId: current.id } });
  await tx.attachment.createMany({ data: previous.attachments.map(row => ({ ...row, taskId: current.id, createdAt: new Date(row.createdAt) })) });
  for (const [field, type, key] of [["assigneeId", "assigned", "notifications.assignedYou"], ["qaId", "qa_assigned", "notifications.assignedYouQa"]] as const) if (previous[field] && previous[field] !== current[field]) await notify(tx, boardId, actor, current, previous[field], type, key);
}

export async function cleanupTicketUploads(urls: string[]) {
  await Promise.allSettled(urls.map(url => del(url)));
}
