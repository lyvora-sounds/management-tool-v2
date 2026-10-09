import db from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { canEditBoard } from "@/lib/boardAccess";
import { type ExternalAccessContext, TICKETS_WRITE_SCOPE } from "@/lib/externalAccess";
import { encodeLogMessage } from "@/lib/activityMessages";
import { sendBoardWebhookNotification } from "@/lib/notifications/webhooks";
import { cleanupTicketUploads, applyTicketRelations, parseRelationPatch, relationSelect, restoreTicketRelations, validateTicketRelations } from "./ticketRelations";
import { isDoneList } from "@/lib/statusTheme";

export class McpWriteError extends Error {}

const select = {
  id: true, title: true, description: true, listId: true, order: true,
  completed: true, completedAt: true, completedById: true,
  archived: true, archivedAt: true, priority: true,
  startDate: true, dueDate: true, updatedAt: true,
  assigneeId: true, qaId: true, epicId: true, quarter: true, shareToken: true,
  ...relationSelect,
} as const;
type TaskState = Prisma.TaskGetPayload<{ select: typeof select }>;
export type Snapshot = Omit<TaskState, "completedAt" | "archivedAt" | "startDate" | "dueDate" | "updatedAt" | "comments" | "attachments" | "subtasks"> & {
  subtasks: { id: string; title: string; completed: boolean; order: number; createdAt: string }[];
  comments: { id: string; content: string; userId: string; createdAt: string; updatedAt: string }[];
  attachments: { id: string; filename: string; url: string; size: number; createdAt: string }[];
  completedAt: string | null; archivedAt: string | null;
  startDate: string | null; dueDate: string | null; updatedAt: string;
};
type Patch = Partial<Pick<TaskState, "title" | "description" | "listId" | "completed" | "archived" | "priority" | "startDate" | "dueDate" | "assigneeId" | "qaId" | "epicId" | "quarter" | "order">> & ReturnType<typeof parseRelationPatch>;

export function taskSnapshot(task: TaskState): Snapshot {
  return { ...task, subtasks: (task.subtasks ?? []).map(row => ({ ...row, createdAt: row.createdAt.toISOString() })), comments: (task.comments ?? []).map(row => ({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() })), attachments: (task.attachments ?? []).map(row => ({ ...row, createdAt: row.createdAt.toISOString() })), completedAt: task.completedAt?.toISOString() ?? null, archivedAt: task.archivedAt?.toISOString() ?? null,
    startDate: task.startDate?.toISOString() ?? null, dueDate: task.dueDate?.toISOString() ?? null, updatedAt: task.updatedAt.toISOString() };
}

export function snapshotsMatch(current: Snapshot, expected: Snapshot) {
  const canonical = (value: unknown): string => JSON.stringify(value, (_key, item) => item && typeof item === "object" && !Array.isArray(item) ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);
  // Older journals contain only the original scalar fields.
  return Object.keys(expected).every(key => canonical(current[key as keyof Snapshot]) === canonical(expected[key as keyof Snapshot]));
}

export function parseTaskPatch(value: unknown): Patch {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new McpWriteError("Changes must be an object");
  const fields = new Set(["title", "description", "listId", "completed", "archived", "priority", "startDate", "dueDate", "assigneeId", "qaId", "epicId", "quarter", "order", "collaboratorIds", "labelIds", "customFields", "subtasks", "comments", "attachments", "shared"]);
  const entries = Object.entries(value);
  if (!entries.length || entries.some(([key]) => !fields.has(key))) throw new McpWriteError("Unsupported or empty task changes");
  const patch: Patch = parseRelationPatch(value as Record<string, unknown>);
  for (const [key, raw] of entries) {
    if (["assigneeId", "qaId", "epicId", "quarter"].includes(key)) {
      if (raw !== null && (typeof raw !== "string" || !raw.trim() || raw.length > 200)) throw new McpWriteError(`Invalid ${key}`);
      if (key === "quarter" && raw !== null && !/^\d{4}-Q[1-4]$/.test(raw as string)) throw new McpWriteError("Invalid quarter");
      Object.assign(patch, { [key]: raw });
    } else if (key === "order") {
      if (!Number.isSafeInteger(raw) || (raw as number) < 0) throw new McpWriteError("Invalid order");
      patch.order = raw as number;
    } else if (key === "title" || key === "listId") {
      if (typeof raw !== "string" || !raw.trim() || raw.length > (key === "title" ? 500 : 200)) throw new McpWriteError(`Invalid ${key}`);
      patch[key] = raw.trim();
    } else if (key === "description") {
      if (raw !== null && (typeof raw !== "string" || raw.length > 50000)) throw new McpWriteError("Invalid description");
      patch.description = typeof raw === "string" ? raw.trim() || null : null;
    } else if (key === "priority") {
      if (raw !== null && (typeof raw !== "string" || !["urgent", "high", "medium", "low"].includes(raw))) throw new McpWriteError("Invalid priority");
      patch.priority = raw as string | null;
    } else if (key === "completed" || key === "archived") {
      if (typeof raw !== "boolean") throw new McpWriteError(`Invalid ${key}`);
      patch[key] = raw;
    } else if (key === "startDate" || key === "dueDate") {
      if (raw === null) patch[key] = null;
      else {
        if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(raw) || Number.isNaN(Date.parse(raw))) throw new McpWriteError(`Invalid ${key}`);
        patch[key] = new Date(raw);
      }
    }
  }
  return patch;
}

export function changeScope(context: ExternalAccessContext) {
  return { organizationId: context.organizationId, ...(context.boardId ? { boardId: context.boardId } : {}) };
}

function boardScope(context: ExternalAccessContext) {
  return { organizationId: context.organizationId, ...(context.boardId ? { id: context.boardId } : {}) };
}

async function writeActor(context: ExternalAccessContext, boardId: string, sessionActorId?: string) {
  if (!context.scopes.includes(TICKETS_WRITE_SCOPE)) throw new McpWriteError("This connection is read-only. Create a read/write connection first.");
  let actorId = sessionActorId;
  if (!actorId) {
    const credential = await db.externalAccessToken.findUnique({ where: { id: context.tokenId }, select: { createdById: true } });
    actorId = credential?.createdById ?? undefined;
  }
  if (!actorId || !(await canEditBoard(actorId, boardId))) throw new McpWriteError("The connection creator no longer has permission to edit this board");
  const user = await db.user.findUnique({ where: { id: actorId }, select: { id: true, name: true, email: true } });
  if (!user) throw new McpWriteError("Connection creator not found");
  return { id: user.id, name: user.name ?? user.email };
}

async function validateCredential(tx: Prisma.TransactionClient, context: ExternalAccessContext, sessionActorId?: string) {
  if (sessionActorId) return;
  const token = await tx.externalAccessToken.findUnique({ where: { id: context.tokenId } });
  if (!token || token.revokedAt || (token.expiresAt && token.expiresAt <= new Date()) ||
    !token.scopes.includes(TICKETS_WRITE_SCOPE) || token.organizationId !== context.organizationId || token.boardId !== context.boardId) {
    throw new McpWriteError("Write credential is expired, revoked or outside this scope");
  }
}

function summary(value: unknown, fallback: string) {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !value.trim() || value.length > 500) throw new McpWriteError("Summary must contain 1 to 500 characters");
  return value.trim();
}

async function activity(tx: Prisma.TransactionClient, boardId: string, actor: { id: string; name: string }, key: string, count: number) {
  await tx.activityLog.create({ data: { boardId, userId: actor.id, type: "mcp_change", message: encodeLogMessage(key, { actor: actor.name, count }) } });
}

async function completionNotification(boardId: string, actorName: string, before: Snapshot[], after: TaskState[]) {
  await Promise.all(after.filter((task) => task.completed && !before.find((old) => old.id === task.id)?.completed)
    .map((task) => sendBoardWebhookNotification({ boardId, eventType: "task_completed", taskTitle: task.title, priority: task.priority, userName: actorName })));
}

export async function createMcpTicket(context: ExternalAccessContext, args: Record<string, unknown>) {
  const input = Object.fromEntries(Object.entries(args).filter(([key]) => key !== "summary"));
  const patch = parseTaskPatch(input);
  if ((patch.attachments ?? []).reduce((size, attachment) => size + (attachment.contentBase64 ? Buffer.byteLength(attachment.contentBase64, "base64") : 0), 0) > 5 * 1024 * 1024) throw new McpWriteError("Total upload size must not exceed 5 MiB");
  if (!patch.title || !patch.listId) throw new McpWriteError("title and listId are required");
  const list = await db.list.findFirst({ where: { id: patch.listId!, board: boardScope(context) }, select: { boardId: true } });
  if (!list) throw new McpWriteError("List not found in this connection");
  const actor = await writeActor(context, list.boardId);
  const uploaded: string[] = [];
  let result;
  try {
    result = await db.$transaction(async (tx) => {
      await validateCredential(tx, context);
      const scopedList = await tx.list.findFirst({ where: { id: patch.listId!, boardId: list.boardId, board: boardScope(context) } });
      if (!scopedList) throw new McpWriteError("List left this connection");
      const last = await tx.task.findFirst({ where: { listId: scopedList.id }, orderBy: { order: "desc" }, select: { order: true } });
      if (patch.completed === undefined && isDoneList(scopedList.title)) patch.completed = true;
      const scalar = await validateTicketRelations(tx, list.boardId, actor, patch);
      const task = await tx.task.create({ data: { ...scalar, title: patch.title!, listId: scopedList.id, order: patch.order ?? (last?.order ?? -1) + 1, completedAt: patch.completed ? new Date() : null, completedById: patch.completed ? actor.id : null, archivedAt: patch.archived ? new Date() : null }, select });
      const relatedBefore = new Map<string, Snapshot>();
      const capture = async (id: string) => {
        if (id === task.id || relatedBefore.has(id)) return;
        const row = await tx.task.findFirst({ where: { id, list: { boardId: list.boardId } }, select });
        if (!row) throw new McpWriteError("Related ticket must belong to the same board");
        relatedBefore.set(id, taskSnapshot(row));
      };
      await applyTicketRelations(tx, list.boardId, actor, { ...task, assigneeId: null, qaId: null }, patch, capture, uploaded);
      const created = await tx.task.findUniqueOrThrow({ where: { id: task.id }, select });
      const relatedAfter = await Promise.all([...relatedBefore.keys()].map(id => tx.task.findUniqueOrThrow({ where: { id }, select })));
      const change = await tx.mcpChange.create({ data: { ...changeScope(context), boardId: list.boardId, tokenId: context.tokenId, actorId: actor.id, kind: "create", summary: summary(args.summary, `Create: ${task.title}`), before: [...relatedBefore.values()], after: [taskSnapshot(created), ...relatedAfter.map(taskSnapshot)] } });
      await activity(tx, list.boardId, actor, "activity.mcpCreated", 1);
      return { changeId: change.id, ticket: taskSnapshot(created) };
    }, { isolationLevel: "Serializable", timeout: 60000 });
  } catch (error) { await cleanupTicketUploads(uploaded); throw error; }
  if (result.ticket.completed) await sendBoardWebhookNotification({ boardId: list.boardId, eventType: "task_completed", taskTitle: result.ticket.title, priority: result.ticket.priority, userName: actor.name });
  return result;
}

export async function updateMcpTickets(context: ExternalAccessContext, args: Record<string, unknown>) {
  if (!Array.isArray(args.updates) || !args.updates.length || args.updates.length > 50) throw new McpWriteError("Provide 1 to 50 ticket updates");
  const updates = args.updates.map((raw: unknown) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new McpWriteError("Invalid ticket update");
    const item = raw as Record<string, unknown>;
    if (typeof item.ticketId !== "string" || !item.ticketId || item.ticketId.length > 200) throw new McpWriteError("Invalid ticketId");
    return { id: item.ticketId, patch: parseTaskPatch(item.changes) };
  });
  const uploadBytes = updates.reduce((total, row) => total + (row.patch.attachments ?? []).reduce((size, attachment) => size + (attachment.contentBase64 ? Buffer.byteLength(attachment.contentBase64, "base64") : 0), 0), 0);
  if (uploadBytes > 5 * 1024 * 1024) throw new McpWriteError("Total upload size must not exceed 5 MiB per batch");
  if (new Set(updates.map((item) => item.id)).size !== updates.length) throw new McpWriteError("Duplicate ticket IDs");
  const board = await db.task.findFirst({ where: { id: updates[0].id, list: { board: boardScope(context) } }, select: { list: { select: { boardId: true } } } });
  if (!board) throw new McpWriteError("Ticket not found in this connection");
  const boardId = board.list.boardId;
  const actor = await writeActor(context, boardId);
  const uploaded: string[] = [];
  let result;
  try {
    result = await db.$transaction(async (tx) => {
      await validateCredential(tx, context);
      const captured = new Map<string, Snapshot>();
      const capture = async (id: string) => {
        if (captured.has(id)) return;
        const row = await tx.task.findFirst({ where: { id, list: { boardId, board: boardScope(context) } }, select });
        if (!row) throw new McpWriteError("Related ticket must belong to the same board");
        captured.set(id, taskSnapshot(row));
      };
      for (const update of updates) {
        const task = await tx.task.findFirst({ where: { id: update.id, list: { boardId, board: boardScope(context) } }, select });
        if (!task) throw new McpWriteError("All updates must belong to one board in this connection");
        const patch = { ...update.patch };
        if (patch.listId && patch.listId !== task.listId) {
          const target = await tx.list.findFirst({ where: { id: patch.listId, boardId } });
          if (!target) throw new McpWriteError("Target list must belong to the same board");
          if (patch.completed === undefined) patch.completed = isDoneList(target.title) ? true : task.completed ? false : undefined;
        }
        const now = new Date();
        await capture(task.id);
        const scalar = await validateTicketRelations(tx, boardId, actor, patch);
        const data = { ...scalar, updatedAt: now,
          ...(patch.completed !== undefined && patch.completed !== task.completed ? { completedAt: patch.completed ? now : null, completedById: patch.completed ? actor.id : null } : {}),
          ...(patch.archived !== undefined && patch.archived !== task.archived ? { archivedAt: patch.archived ? now : null } : {}),
        };
        const changed = await tx.task.updateMany({ where: { id: task.id, updatedAt: task.updatedAt }, data });
        if (changed.count !== 1) throw new McpWriteError("A ticket changed concurrently. Retry with fresh ticket data.");
        await applyTicketRelations(tx, boardId, actor, task, patch, capture, uploaded);
      }
      const before = [...captured.values()];
      const after = await Promise.all(before.map(row => tx.task.findUniqueOrThrow({ where: { id: row.id }, select })));
      const change = await tx.mcpChange.create({ data: { ...changeScope(context), boardId, tokenId: context.tokenId, actorId: actor.id, kind: "update", summary: summary(args.summary, `Update ${updates.length} tickets`), before, after: after.map(taskSnapshot) } });
      await activity(tx, boardId, actor, "activity.mcpUpdated", updates.length);
      return { changeId: change.id, before, after };
    }, { isolationLevel: "Serializable", timeout: 60000 });
  } catch (error) { await cleanupTicketUploads(uploaded); throw error; }
  await completionNotification(boardId, actor.name, result.before, result.after);
  return { changeId: result.changeId, tickets: result.after.map(taskSnapshot) };
}

export async function listMcpChanges(context: ExternalAccessContext) {
  return db.mcpChange.findMany({ where: changeScope(context), orderBy: { createdAt: "desc" }, take: 50,
    select: { id: true, boardId: true, kind: true, summary: true, createdAt: true, revertedAt: true, revertsChangeId: true } });
}

export async function revertMcpChange(context: ExternalAccessContext, changeId: string, confirm: boolean, sessionActorId?: string) {
  const change = await db.mcpChange.findFirst({ where: { id: changeId, ...changeScope(context) } });
  if (!change) throw new McpWriteError("Change not found in this connection");
  if (change.revertedAt) throw new McpWriteError("This change has already been reverted");
  const actor = await writeActor(context, change.boardId, sessionActorId);
  const before = change.before as unknown as Snapshot[];
  const after = change.after as unknown as Snapshot[];
  if (!confirm) return { changeId: change.id, preview: true, operation: change.kind === "create" ? "Archive created tickets" : "Restore previous task fields", before, after };
  const result = await db.$transaction(async (tx) => {
    await validateCredential(tx, context, sessionActorId);
    const marked = await tx.mcpChange.updateMany({ where: { id: change.id, revertedAt: null }, data: { revertedAt: new Date() } });
    if (marked.count !== 1) throw new McpWriteError("This change has already been reverted");
    for (const expected of after) {
      const current = await tx.task.findFirst({ where: { id: expected.id, list: { boardId: change.boardId, board: boardScope(context) } }, select });
      if (!current || !snapshotsMatch(taskSnapshot(current), expected)) throw new McpWriteError("Revert conflict: a ticket has changed since this operation. Nothing was reverted.");
    }
    const restored: TaskState[] = [];
    for (const expected of after) {
      const current = await tx.task.findFirst({ where: { id: expected.id, list: { boardId: change.boardId, board: boardScope(context) } }, select });
      if (!current || !snapshotsMatch(taskSnapshot(current), expected)) throw new McpWriteError("Revert conflict: a ticket has changed since this operation. Nothing was reverted.");
      const previous = before.find((task) => task.id === expected.id);
      let data: Prisma.TaskUpdateManyMutationInput;
      if (!previous) data = { archived: true, archivedAt: new Date() };
      else {
        const target = await tx.list.findFirst({ where: { id: previous.listId, boardId: change.boardId } });
        if (!target) throw new McpWriteError("The original list no longer exists. Nothing was reverted.");
        const fields = { title: previous.title, description: previous.description, listId: previous.listId, order: previous.order, completed: previous.completed, completedById: previous.completedById, archived: previous.archived, priority: previous.priority, ...(previous.assigneeId !== undefined ? { assigneeId: previous.assigneeId, qaId: previous.qaId, epicId: previous.epicId, quarter: previous.quarter, shareToken: previous.shareToken } : {}) };
        data = { ...fields, completedAt: previous.completedAt ? new Date(previous.completedAt) : null, archivedAt: previous.archivedAt ? new Date(previous.archivedAt) : null,
          startDate: previous.startDate ? new Date(previous.startDate) : null, dueDate: previous.dueDate ? new Date(previous.dueDate) : null };
      }
      const updated = await tx.task.updateMany({ where: { id: expected.id, updatedAt: current.updatedAt }, data });
      if (updated.count !== 1) throw new McpWriteError("Revert conflict: a ticket changed concurrently. Nothing was reverted.");
      if (previous) await restoreTicketRelations(tx, change.boardId, actor, current, previous);
      restored.push(await tx.task.findUniqueOrThrow({ where: { id: expected.id }, select }));
    }
    const undo = await tx.mcpChange.create({ data: { ...changeScope(context), boardId: change.boardId, tokenId: context.tokenId || null, actorId: actor.id, kind: "revert", summary: `Revert ${change.id}`, before: after, after: restored.map(taskSnapshot), revertsChangeId: change.id } });
    await activity(tx, change.boardId, actor, "activity.mcpReverted", after.length);
    return { changeId: undo.id, restored };
  }, { isolationLevel: "Serializable" });
  await completionNotification(change.boardId, actor.name, after, result.restored);
  return { changeId: result.changeId, revertedChangeId: change.id, tickets: result.restored.map(taskSnapshot) };
}
