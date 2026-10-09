import db from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { canEditBoard } from "@/lib/boardAccess";
import { type ExternalAccessContext, TICKETS_WRITE_SCOPE } from "@/lib/externalAccess";
import { encodeLogMessage } from "@/lib/activityMessages";
import { sendBoardWebhookNotification } from "@/lib/notifications/webhooks";
import { isDoneList } from "@/lib/statusTheme";

export class McpWriteError extends Error {}

const select = {
  id: true, title: true, description: true, listId: true, order: true,
  completed: true, completedAt: true, completedById: true,
  archived: true, archivedAt: true, priority: true,
  startDate: true, dueDate: true, updatedAt: true,
} as const;
type TaskState = Prisma.TaskGetPayload<{ select: typeof select }>;
type Snapshot = Omit<TaskState, "completedAt" | "archivedAt" | "startDate" | "dueDate" | "updatedAt"> & {
  completedAt: string | null; archivedAt: string | null;
  startDate: string | null; dueDate: string | null; updatedAt: string;
};
type Patch = Partial<Pick<TaskState, "title" | "description" | "listId" | "completed" | "archived" | "priority" | "startDate" | "dueDate">>;

export function taskSnapshot(task: TaskState): Snapshot {
  return { ...task, completedAt: task.completedAt?.toISOString() ?? null, archivedAt: task.archivedAt?.toISOString() ?? null,
    startDate: task.startDate?.toISOString() ?? null, dueDate: task.dueDate?.toISOString() ?? null, updatedAt: task.updatedAt.toISOString() };
}

export function snapshotsMatch(current: Snapshot, expected: Snapshot) {
  return Object.keys(current).every((key) => current[key as keyof Snapshot] === expected[key as keyof Snapshot]);
}

export function parseTaskPatch(value: unknown): Patch {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new McpWriteError("Changes must be an object");
  const fields = new Set(["title", "description", "listId", "completed", "archived", "priority", "startDate", "dueDate"]);
  const entries = Object.entries(value);
  if (!entries.length || entries.some(([key]) => !fields.has(key))) throw new McpWriteError("Unsupported or empty task changes");
  const patch: Patch = {};
  for (const [key, raw] of entries) {
    if (key === "title" || key === "listId") {
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
  const patch = parseTaskPatch({ title: args.title, listId: args.listId, ...(args.description !== undefined ? { description: args.description } : {}), ...(args.priority !== undefined ? { priority: args.priority } : {}) });
  const list = await db.list.findFirst({ where: { id: patch.listId!, board: boardScope(context) }, select: { boardId: true } });
  if (!list) throw new McpWriteError("List not found in this connection");
  const actor = await writeActor(context, list.boardId);
  return db.$transaction(async (tx) => {
    await validateCredential(tx, context);
    const scopedList = await tx.list.findFirst({ where: { id: patch.listId!, boardId: list.boardId, board: boardScope(context) } });
    if (!scopedList) throw new McpWriteError("List left this connection");
    const last = await tx.task.findFirst({ where: { listId: scopedList.id }, orderBy: { order: "desc" }, select: { order: true } });
    const task = await tx.task.create({ data: { title: patch.title!, description: patch.description, priority: patch.priority, listId: scopedList.id, order: (last?.order ?? -1) + 1 }, select });
    const change = await tx.mcpChange.create({ data: { ...changeScope(context), boardId: list.boardId, tokenId: context.tokenId, actorId: actor.id, kind: "create", summary: summary(args.summary, `Create: ${task.title}`), before: [], after: [taskSnapshot(task)] } });
    await activity(tx, list.boardId, actor, "activity.mcpCreated", 1);
    return { changeId: change.id, ticket: taskSnapshot(task) };
  }, { isolationLevel: "Serializable" });
}

export async function updateMcpTickets(context: ExternalAccessContext, args: Record<string, unknown>) {
  if (!Array.isArray(args.updates) || !args.updates.length || args.updates.length > 50) throw new McpWriteError("Provide 1 to 50 ticket updates");
  const updates = args.updates.map((raw: unknown) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new McpWriteError("Invalid ticket update");
    const item = raw as Record<string, unknown>;
    if (typeof item.ticketId !== "string" || !item.ticketId || item.ticketId.length > 200) throw new McpWriteError("Invalid ticketId");
    return { id: item.ticketId, patch: parseTaskPatch(item.changes) };
  });
  if (new Set(updates.map((item) => item.id)).size !== updates.length) throw new McpWriteError("Duplicate ticket IDs");
  const board = await db.task.findFirst({ where: { id: updates[0].id, list: { board: boardScope(context) } }, select: { list: { select: { boardId: true } } } });
  if (!board) throw new McpWriteError("Ticket not found in this connection");
  const boardId = board.list.boardId;
  const actor = await writeActor(context, boardId);
  const result = await db.$transaction(async (tx) => {
    await validateCredential(tx, context);
    const before: Snapshot[] = []; const after: TaskState[] = [];
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
      const data = { ...patch,
        ...(patch.completed !== undefined && patch.completed !== task.completed ? { completedAt: patch.completed ? now : null, completedById: patch.completed ? actor.id : null } : {}),
        ...(patch.archived !== undefined && patch.archived !== task.archived ? { archivedAt: patch.archived ? now : null } : {}),
      };
      const changed = await tx.task.updateMany({ where: { id: task.id, updatedAt: task.updatedAt }, data });
      if (changed.count !== 1) throw new McpWriteError("A ticket changed concurrently. Retry with fresh ticket data.");
      const updated = await tx.task.findUniqueOrThrow({ where: { id: task.id }, select });
      before.push(taskSnapshot(task)); after.push(updated);
    }
    const change = await tx.mcpChange.create({ data: { ...changeScope(context), boardId, tokenId: context.tokenId, actorId: actor.id, kind: "update", summary: summary(args.summary, `Update ${updates.length} tickets`), before, after: after.map(taskSnapshot) } });
    await activity(tx, boardId, actor, "activity.mcpUpdated", updates.length);
    return { changeId: change.id, before, after };
  }, { isolationLevel: "Serializable" });
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
        const fields = { title: previous.title, description: previous.description, listId: previous.listId, order: previous.order, completed: previous.completed, completedById: previous.completedById, archived: previous.archived, priority: previous.priority };
        data = { ...fields, completedAt: previous.completedAt ? new Date(previous.completedAt) : null, archivedAt: previous.archivedAt ? new Date(previous.archivedAt) : null,
          startDate: previous.startDate ? new Date(previous.startDate) : null, dueDate: previous.dueDate ? new Date(previous.dueDate) : null };
      }
      const updated = await tx.task.updateMany({ where: { id: expected.id, updatedAt: current.updatedAt }, data });
      if (updated.count !== 1) throw new McpWriteError("Revert conflict: a ticket changed concurrently. Nothing was reverted.");
      restored.push(await tx.task.findUniqueOrThrow({ where: { id: expected.id }, select }));
    }
    const undo = await tx.mcpChange.create({ data: { ...changeScope(context), boardId: change.boardId, tokenId: context.tokenId || null, actorId: actor.id, kind: "revert", summary: `Revert ${change.id}`, before: after, after: restored.map(taskSnapshot), revertsChangeId: change.id } });
    await activity(tx, change.boardId, actor, "activity.mcpReverted", after.length);
    return { changeId: undo.id, restored };
  }, { isolationLevel: "Serializable" });
  await completionNotification(change.boardId, actor.name, after, result.restored);
  return { changeId: result.changeId, revertedChangeId: change.id, tickets: result.restored.map(taskSnapshot) };
}
