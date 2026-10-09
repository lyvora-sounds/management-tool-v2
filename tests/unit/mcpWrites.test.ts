import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ExternalAccessContext } from "@/lib/externalAccess";

const editable = vi.fn();
const lookup = vi.fn();
const update = vi.fn();
const journal = vi.fn();
const marked = vi.fn();
const credential = vi.fn();
const list = vi.fn();
const logs = vi.fn();
const history = vi.fn();
const notification = vi.fn();
const customWrite = vi.fn();
const create = vi.fn();
const tx = { board: { findUnique: async () => ({ memberCanAssign: true }) }, notification: { create: notification }, customField: { findFirst: async () => ({ id: "env", type: "SELECT", defaultKey: "environment", options: ["production"] }) }, customFieldValue: { findUnique: async () => null, upsert: customWrite }, task: { create, findFirst: lookup, updateMany: update, findUniqueOrThrow: lookup }, list: { findFirst: list }, externalAccessToken: { findUnique: credential }, mcpChange: { create: journal, updateMany: marked }, activityLog: { create: logs } };
vi.mock("@/lib/boardAccess", () => ({ canEditBoard: (...args: unknown[]) => editable(...args), canReadBoard: async () => true, isBoardAdmin: async () => true }));
vi.mock("@/lib/notifications/webhooks", () => ({ sendBoardWebhookNotification: vi.fn() }));
vi.mock("@/lib/db", () => ({ default: {
  list: { findFirst: (...args: unknown[]) => list(...args) },
  task: { findFirst: async () => ({ list: { boardId: "board-1" } }) },
  user: { findUnique: async () => ({ id: "user-1", name: "Owner", email: "owner@test.invalid" }) },
  externalAccessToken: { findUnique: async () => ({ createdById: "user-1" }) },
  mcpChange: { findFirst: (...args: unknown[]) => history(...args) },
  $transaction: (callback: (client: unknown) => unknown) => callback(tx),
} }));
const { createMcpTicket, updateMcpTickets, revertMcpChange, taskSnapshot, snapshotsMatch, parseTaskPatch } = await import("@/lib/mcp/writes");
const context: ExternalAccessContext = { tokenId: "token-1", organizationId: "org-1", boardId: "board-1", boardTitle: "Board", scopes: ["tickets:read", "tickets:write"] };
const task = { id: "task-1", title: "Original", description: null, listId: "list-1", order: 0, completed: false, completedAt: null, completedById: null, archived: false, archivedAt: null, priority: null, assigneeId: null, qaId: null, epicId: null, quarter: null, shareToken: null, collaborators: [], labels: [], customValues: [], subtasks: [], comments: [], attachments: [], startDate: null, dueDate: null, updatedAt: new Date("2026-10-09T10:00:00.000Z") };
beforeEach(() => {
  vi.clearAllMocks(); editable.mockResolvedValue(true);
  credential.mockResolvedValue({ scopes: context.scopes, organizationId: context.organizationId, boardId: context.boardId });
  create.mockResolvedValue(task);
  lookup.mockResolvedValue(task); update.mockResolvedValue({ count: 1 });
  list.mockResolvedValue({ id: "list-1", boardId: "board-1", title: "Todo" });
  journal.mockResolvedValue({ id: "change-1" }); marked.mockResolvedValue({ count: 1 });
  history.mockResolvedValue({ id: "change-0", boardId: "board-1", kind: "update", before: [taskSnapshot({ ...task, title: "Before" })], after: [taskSnapshot(task)] });
});
describe("MCP task writes and revert guards", () => {
  it("rejects read-only credentials and users who lost board editing permission", async () => {
    const args = { updates: [{ ticketId: task.id, changes: { title: "Changed" } }] };
    await expect(updateMcpTickets({ ...context, scopes: ["tickets:read"] }, args)).rejects.toThrow("read-only");
    editable.mockResolvedValue(false);
    await expect(updateMcpTickets(context, args)).rejects.toThrow("permission");
    expect(update).not.toHaveBeenCalled();
  });
  it("rechecks revocation inside the write transaction", async () => {
    credential.mockResolvedValue({ ...context, revokedAt: new Date() });
    await expect(updateMcpTickets(context, { updates: [{ ticketId: task.id, changes: { archived: true } }] })).rejects.toThrow("revoked");
    expect(update).not.toHaveBeenCalled();
  });
  it("guards writes with the task revision and records before/after with activity", async () => {
    await updateMcpTickets(context, { updates: [{ ticketId: task.id, changes: { archived: true } }] });
    expect(update.mock.calls[0][0]).toMatchObject({ where: { id: task.id, updatedAt: task.updatedAt }, data: { archived: true, archivedAt: expect.any(Date) } });
    expect(journal.mock.calls[0][0].data).toMatchObject({ organizationId: "org-1", boardId: "board-1", before: [taskSnapshot(task)], kind: "update" });
    expect(logs).toHaveBeenCalledOnce();
  });
  it("updates QA and Environment atomically and journals both fields", async () => {
    const updated = { ...task, qaId: "mario", customValues: [{ customFieldId: "env", value: "production" }] };
    lookup.mockResolvedValueOnce(task).mockResolvedValueOnce(task).mockResolvedValueOnce(updated);
    const result = await updateMcpTickets(context, { updates: [{ ticketId: task.id, changes: { qaId: "mario", customFields: [{ customFieldId: "env", value: "production" }] } }] });
    expect(update.mock.calls[0][0].data).toMatchObject({ qaId: "mario" });
    expect(update.mock.calls[0][0].data).not.toHaveProperty("customFields");
    expect(customWrite).toHaveBeenCalledOnce(); expect(notification).toHaveBeenCalledOnce();
    expect(result.tickets[0]).toMatchObject({ qaId: "mario", customValues: [{ customFieldId: "env", value: "production" }] });
    expect(journal.mock.calls[0][0].data).toMatchObject({ before: [taskSnapshot(task)], after: [taskSnapshot(updated)] });
  });
  it("notifies newly assigned QA when creating a ticket", async () => {
    create.mockResolvedValue({ ...task, qaId: "mario" });
    await createMcpTicket(context, { title: "New ticket", listId: "list-1", qaId: "mario" });
    expect(create.mock.calls[0][0].data).toMatchObject({ title: "New ticket", qaId: "mario" });
    expect(notification.mock.calls[0][0].data).toMatchObject({ userId: "mario", type: "qa_assigned" });
  });
  it("rejects lists outside the current board and concurrent edits before journaling", async () => {
    list.mockResolvedValue(null);
    await expect(updateMcpTickets(context, { updates: [{ ticketId: task.id, changes: { listId: "foreign" } }] })).rejects.toThrow("same board");
    update.mockResolvedValue({ count: 0 });
    await expect(updateMcpTickets(context, { updates: [{ ticketId: task.id, changes: { title: "Changed" } }] })).rejects.toThrow("concurrently");
    expect(journal).not.toHaveBeenCalled();
  });
  it("previews a revert without writing and requires exact post-change state", async () => {
    expect(await revertMcpChange(context, "change-0", false)).toMatchObject({ preview: true });
    expect(marked).not.toHaveBeenCalled();
    lookup.mockResolvedValue({ ...task, updatedAt: new Date(), title: "Later edit" });
    await expect(revertMcpChange(context, "change-0", true)).rejects.toThrow("Revert conflict");
    expect(update).not.toHaveBeenCalled(); expect(journal).not.toHaveBeenCalled();
  });
  it("undoes creation by archiving rather than deleting task content", async () => {
    history.mockResolvedValue({ id: "change-0", boardId: "board-1", kind: "create", before: [], after: [taskSnapshot(task)] });
    await revertMcpChange(context, "change-0", true);
    expect(update.mock.calls[0][0].data).toEqual({ archived: true, archivedAt: expect.any(Date) });
    expect(journal.mock.calls[0][0].data.revertsChangeId).toBe("change-0");
  });
  it("compares JSONB snapshots independently of property order", () => {
    const snapshot = taskSnapshot(task);
    expect(snapshotsMatch(snapshot, Object.fromEntries(Object.entries(snapshot).reverse()) as typeof snapshot)).toBe(true);
    expect(snapshotsMatch(snapshot, { ...snapshot, completed: true })).toBe(false);
  });
  it("rejects unsupported fields, ambiguous batch IDs and oversized batches", async () => {
    expect(() => parseTaskPatch({ userId: "foreign" })).toThrow();
    expect(() => parseTaskPatch({ completed: "true" })).toThrow();
    const item = { ticketId: task.id, changes: { title: "Changed" } };
    await expect(updateMcpTickets(context, { updates: [item, item] })).rejects.toThrow("Duplicate");
    await expect(updateMcpTickets(context, { updates: Array(51).fill(item) })).rejects.toThrow("1 to 50");
  });
});
