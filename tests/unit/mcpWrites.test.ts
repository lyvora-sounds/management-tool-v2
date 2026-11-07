import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ExternalAccessContext } from "@/lib/externalAccess";

const editable = vi.fn();
const admin = vi.fn();
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
const epicCreate = vi.fn();
const boardLookup = vi.fn();
const boardUpdate = vi.fn(async (..._args: unknown[]) => ({ key: "LY", nextTicketNumber: 2 }));
const tx = { board: { findUnique: async () => ({ memberCanAssign: true }), findFirst: (...args: unknown[]) => boardLookup(...args), update: (...args: unknown[]) => boardUpdate(...args) }, epic: { create: epicCreate }, notification: { create: notification }, customField: { findFirst: async () => ({ id: "env", type: "SELECT", defaultKey: "environment", options: ["production"] }) }, customFieldValue: { findUnique: async () => null, upsert: customWrite }, task: { create, findFirst: lookup, updateMany: update, findUniqueOrThrow: lookup }, list: { findFirst: list }, externalAccessToken: { findUnique: credential }, mcpChange: { create: journal, updateMany: marked }, activityLog: { create: logs } };
const historyList = vi.fn();
vi.mock("@/lib/boardAccess", () => ({
  canEditBoard: (...args: unknown[]) => editable(...args),
  canReadBoard: async () => true,
  isBoardAdmin: (...args: unknown[]) => admin(...args),
  adminBoardWhere: (userId: string) => ({ OR: [{ userId }] }),
  readableBoardWhere: (userId: string) => ({ OR: [{ userId }, { members: { some: { userId } } }] }),
}));
vi.mock("@/lib/notifications/webhooks", () => ({ sendBoardWebhookNotification: vi.fn() }));
vi.mock("@/lib/db", () => ({ default: {
  list: { findFirst: (...args: unknown[]) => list(...args) },
  board: { findFirst: (...args: unknown[]) => boardLookup(...args) },
  task: { findFirst: async () => ({ list: { boardId: "board-1", board: { organizationId: "org-1" } } }) },
  user: { findUnique: async () => ({ id: "user-1", name: "Owner", email: "owner@test.invalid" }) },
  externalAccessToken: { findUnique: async () => ({ createdById: "user-1" }) },
  mcpChange: {
    findFirst: (...args: unknown[]) => history(...args),
    findMany: (...args: unknown[]) => historyList(...args),
  },
  $transaction: (callback: (client: unknown) => unknown) => callback(tx),
} }));
const { createMcpTicket, createMcpEpic, updateMcpTickets, revertMcpChange, listMcpChanges, taskSnapshot, snapshotsMatch, parseTaskPatch } = await import("@/lib/mcp/writes");
const context: ExternalAccessContext = { tokenId: "token-1", organizationId: "org-1", boardId: "board-1", boardTitle: "Board", scopes: ["tickets:read", "tickets:write"], fullAccess: false, createdById: "user-1" };
const task = { id: "task-1", title: "Original", description: null, listId: "list-1", order: 0, completed: false, completedAt: null, completedById: null, archived: false, archivedAt: null, priority: null, assigneeId: null, qaId: null, reporterId: null, epicId: null, quarter: null, shareToken: null, collaborators: [], labels: [], customValues: [], subtasks: [], comments: [], attachments: [], startDate: null, dueDate: null, updatedAt: new Date("2026-10-09T10:00:00.000Z") };
beforeEach(() => {
  vi.clearAllMocks(); editable.mockResolvedValue(true); admin.mockResolvedValue(true);
  credential.mockResolvedValue({ scopes: context.scopes, organizationId: context.organizationId, boardId: context.boardId, fullAccess: false, createdById: "user-1" });
  create.mockResolvedValue(task);
  epicCreate.mockResolvedValue({ id: "epic-1", title: "kiki-infra-migration", description: null, color: "#3b82f6", quarter: null, status: "open", boardId: "board-1" });
  boardLookup.mockResolvedValue({ id: "board-1" });
  lookup.mockResolvedValue(task); update.mockResolvedValue({ count: 1 });
  list.mockResolvedValue({ id: "list-1", boardId: "board-1", title: "Todo", board: { organizationId: "org-1" } });
  journal.mockResolvedValue({ id: "change-1" }); marked.mockResolvedValue({ count: 1 });
  history.mockResolvedValue({ id: "change-0", boardId: "board-1", organizationId: "org-1", kind: "update", before: [taskSnapshot({ ...task, title: "Before" })], after: [taskSnapshot(task)] });
  historyList.mockResolvedValue([]);
});

const personalContext: ExternalAccessContext = {
  tokenId: "token-personal",
  organizationId: null,
  boardId: null,
  boardTitle: null,
  scopes: ["tickets:read", "tickets:write"],
  fullAccess: true,
  createdById: "user-1",
};
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

describe("MCP epic creation", () => {
  it("creates an epic on the bound board without asking for a board id", async () => {
    const result = await createMcpEpic(context, { title: "kiki-infra-migration", description: "Terraform and Ansible", quarter: "2026-Q4" });
    expect(epicCreate.mock.calls[0][0].data).toMatchObject({
      boardId: "board-1",
      title: "kiki-infra-migration",
      description: "Terraform and Ansible",
      quarter: "2026-Q4",
      color: "#3b82f6",
    });
    expect(result.epic).toMatchObject({ id: "epic-1", title: "kiki-infra-migration", boardId: "board-1" });
    expect(journal).not.toHaveBeenCalled();
    expect(logs).toHaveBeenCalledOnce();
  });

  it("requires boardId on an organization connection and rejects boards outside scope", async () => {
    const org = { ...context, boardId: null, boardTitle: null };
    await expect(createMcpEpic(org, { title: "Migration" })).rejects.toThrow("boardId");
    expect(epicCreate).not.toHaveBeenCalled();
    boardLookup.mockResolvedValue(null);
    await expect(createMcpEpic(org, { title: "Migration", boardId: "foreign" })).rejects.toThrow("connection");
    expect(epicCreate).not.toHaveBeenCalled();
  });

  it("rejects read-only credentials, blank titles and invalid quarters", async () => {
    await expect(createMcpEpic({ ...context, scopes: ["tickets:read"] }, { title: "Migration" })).rejects.toThrow("read-only");
    await expect(createMcpEpic(context, { title: "   " })).rejects.toThrow("title");
    await expect(createMcpEpic(context, { title: "Migration", quarter: "Q4" })).rejects.toThrow("quarter");
    expect(epicCreate).not.toHaveBeenCalled();
  });

  it("creates an epic on a personal connection with boardId and edit rights", async () => {
    credential.mockResolvedValue({
      scopes: personalContext.scopes,
      organizationId: null,
      boardId: null,
      fullAccess: true,
      createdById: "user-1",
    });
    await expect(createMcpEpic(personalContext, { title: "Migration" })).rejects.toThrow("boardId");
    const result = await createMcpEpic(personalContext, { title: "Migration", boardId: "board-1" });
    expect(boardLookup.mock.calls[0][0].where).toMatchObject({
      id: "board-1",
      OR: [{ userId: "user-1" }, { members: { some: { userId: "user-1" } } }],
    });
    expect(result.epic).toMatchObject({ id: "epic-1", boardId: "board-1" });
    expect(editable).toHaveBeenCalled();
    expect(admin).not.toHaveBeenCalled();
    editable.mockResolvedValue(false);
    await expect(createMcpEpic(personalContext, { title: "Migration", boardId: "board-1" })).rejects.toThrow("permission");
  });
});

describe("personal MCP membership rights", () => {
  beforeEach(() => {
    credential.mockResolvedValue({
      scopes: personalContext.scopes,
      organizationId: null,
      boardId: null,
      fullAccess: true,
      createdById: "user-1",
    });
  });

  it("lets a member create and update tickets on a personal connection", async () => {
    await createMcpTicket(personalContext, { title: "New ticket", listId: "list-1" });
    expect(create).toHaveBeenCalled();
    expect(editable).toHaveBeenCalled();
    await updateMcpTickets(personalContext, { updates: [{ ticketId: task.id, changes: { title: "Changed" } }] });
    expect(update).toHaveBeenCalled();
  });

  it("blocks viewers from writing on a personal connection", async () => {
    editable.mockResolvedValue(false);
    await expect(
      createMcpTicket(personalContext, { title: "New ticket", listId: "list-1" }),
    ).rejects.toThrow("permission");
    expect(create).not.toHaveBeenCalled();
  });

  it("lists personal history only for boards the creator currently admins", async () => {
    historyList.mockResolvedValue([{ id: "change-1" }]);
    await listMcpChanges(personalContext);
    expect(historyList.mock.calls[0][0].where).toEqual({ board: { OR: [{ userId: "user-1" }] } });
  });

  it("requires board admin to revert on a personal connection", async () => {
    admin.mockResolvedValue(false);
    await expect(revertMcpChange(personalContext, "change-0", false)).rejects.toThrow("owner or admin");
    expect(marked).not.toHaveBeenCalled();
    admin.mockResolvedValue(true);
    expect(await revertMcpChange(personalContext, "change-0", false)).toMatchObject({ preview: true });
  });
});
