import { beforeEach, describe, expect, it, vi } from "vitest";
const readable = vi.fn(); const admin = vi.fn(); const put = vi.fn(); const del = vi.fn();
vi.mock("@/lib/boardAccess", () => ({ canReadBoard: (...args: unknown[]) => readable(...args), isBoardAdmin: (...args: unknown[]) => admin(...args), canEditBoard: vi.fn() }));
vi.mock("@/lib/db", () => ({ default: {} }));
vi.mock("@vercel/blob", () => ({ put: (...args: unknown[]) => put(...args), del: (...args: unknown[]) => del(...args) }));
vi.mock("@/lib/notifications/webhooks", () => ({ sendBoardWebhookNotification: vi.fn() }));
const { parseRelationPatch, validateTicketRelations, applyTicketRelations, cleanupTicketUploads } = await import("@/lib/mcp/ticketRelations");
const { parseTaskPatch, snapshotsMatch, taskSnapshot } = await import("@/lib/mcp/writes");
const actor = { id: "actor", name: "Daniel" };
const task = { id: "ticket", title: "Ticket to test", assigneeId: null, qaId: null, shareToken: null, collaborators: [], labels: [], customValues: [], subtasks: [], comments: [], attachments: [] };
function transaction() {
  const model = () => ({ create: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn(), update: vi.fn(), delete: vi.fn() });
  return {
    board: { findUnique: vi.fn().mockResolvedValue({ memberCanAssign: true }) },
    epic: { findFirst: vi.fn().mockResolvedValue({ id: "epic" }) }, label: { count: vi.fn().mockResolvedValue(1) },
    task: { ...model(), count: vi.fn().mockResolvedValue(0), findFirst: vi.fn() },
    customField: { findFirst: vi.fn().mockResolvedValue({ id: "environment", type: "SELECT", defaultKey: "environment", options: ["dev", "production"] }) },
    customFieldValue: { upsert: vi.fn(), findUnique: vi.fn().mockResolvedValue(null) },
    notification: model(), taskCollaborator: model(), taskLabel: model(), subtask: model(), comment: model(), attachment: model(),
  };
}
type Tx = Parameters<typeof validateTicketRelations>[0];
beforeEach(() => { vi.clearAllMocks(); readable.mockResolvedValue(true); admin.mockResolvedValue(false); put.mockResolvedValue({ url: "https://store.private.blob.vercel-storage.com/file" }); });
describe("expanded MCP ticket fields", () => {
  it("accepts QA, assignee, epic, quarter, order and validated relation patches", () => {
    expect(parseTaskPatch({ qaId: "mario", assigneeId: null, epicId: "epic", quarter: "2026-Q4", order: 2, customFields: [{ customFieldId: "env", value: "production" }] })).toMatchObject({ qaId: "mario", quarter: "2026-Q4", order: 2 });
    for (const changes of [{ quarter: "now" }, { order: -1 }, { shareToken: "chosen" }, { googleEventId: "x" }, { customFields: [{ customFieldId: "env", value: 3 }] }, { collaboratorIds: ["mario", "mario"] }, { comments: [{ id: "comment", delete: true, content: "x" }] }]) expect(() => parseTaskPatch(changes)).toThrow();
  });
  it("enforces assignment policy and recipient board access", async () => {
    const tx = transaction(); tx.board.findUnique.mockResolvedValue({ memberCanAssign: false });
    await expect(validateTicketRelations(tx as unknown as Tx, "board", actor, { qaId: "mario" })).rejects.toThrow("permission");
    admin.mockResolvedValue(true);
    await expect(validateTicketRelations(tx as unknown as Tx, "board", actor, { qaId: "mario" })).resolves.toEqual({ qaId: "mario" });
    readable.mockResolvedValue(false);
    await expect(validateTicketRelations(tx as unknown as Tx, "board", actor, { qaId: "outside" })).rejects.toThrow("access");
  });
  it("rejects foreign epics and labels", async () => {
    const tx = transaction(); tx.epic.findFirst.mockResolvedValue(null);
    await expect(validateTicketRelations(tx as unknown as Tx, "board", actor, { epicId: "foreign" })).rejects.toThrow("same board");
    tx.label.count.mockResolvedValue(0);
    await expect(validateTicketRelations(tx as unknown as Tx, "board", actor, { labelIds: ["foreign"] })).rejects.toThrow("same board");
  });
  it("sets QA idempotently and saves Environment production without changing other fields", async () => {
    const tx = transaction();
    await applyTicketRelations(tx as unknown as Tx, "board", actor, task, { qaId: "mario", customFields: [{ customFieldId: "environment", value: "production" }] }, vi.fn());
    expect(tx.notification.create).toHaveBeenCalledWith({ data: expect.objectContaining({ type: "qa_assigned", userId: "mario" }) });
    expect(tx.customFieldValue.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: { value: "production" }, create: { taskId: "ticket", customFieldId: "environment", value: "production" } }));
    tx.notification.create.mockClear();
    await applyTicketRelations(tx as unknown as Tx, "board", actor, { ...task, qaId: "mario" }, { qaId: "mario" }, vi.fn());
    expect(tx.notification.create).not.toHaveBeenCalled();
  });
  it("rejects invalid SELECT, NUMBER, disabled and foreign custom fields", async () => {
    const tx = transaction(); const apply = (value: string) => applyTicketRelations(tx as unknown as Tx, "board", actor, task, { customFields: [{ customFieldId: "environment", value }] }, vi.fn());
    await expect(apply("staging")).rejects.toThrow("option");
    tx.customField.findFirst.mockResolvedValue({ id: "number", type: "NUMBER", defaultKey: null });
    await expect(apply("NaN")).rejects.toThrow("number");
    tx.customField.findFirst.mockResolvedValue(null);
    await expect(apply("production")).rejects.toThrow("disabled");
    expect(tx.customFieldValue.upsert).not.toHaveBeenCalled();
  });
  it("rejects self and foreign ticket references", async () => {
    const tx = transaction(); tx.customField.findFirst.mockResolvedValue({ id: "parent", type: "TEXT", defaultKey: "parent" });
    for (const value of ["ticket", "outside"]) await expect(applyTicketRelations(tx as unknown as Tx, "board", actor, task, { customFields: [{ customFieldId: "parent", value }] }, vi.fn())).rejects.toThrow();
    expect(tx.customFieldValue.upsert).not.toHaveBeenCalled();
  });
  it("does not allow foreign checklist, comment or attachment IDs", async () => {
    const tx = transaction();
    for (const patch of [{ subtasks: [{ id: "outside", title: "x", completed: false, order: 0 }] }, { comments: [{ id: "outside", delete: true }] }, { attachments: [{ id: "outside", delete: true }] }]) await expect(applyTicketRelations(tx as unknown as Tx, "board", actor, task, patch, vi.fn())).rejects.toThrow();
  });
  it("requires comment authorship or admin permission", async () => {
    const tx = transaction(); const withComment = { ...task, comments: [{ id: "comment", content: "text", userId: "someone", createdAt: new Date(), updatedAt: new Date() }] };
    await expect(applyTicketRelations(tx as unknown as Tx, "board", actor, withComment, { comments: [{ id: "comment", content: "edit" }] }, vi.fn())).rejects.toThrow("permission");
    admin.mockResolvedValue(true);
    await applyTicketRelations(tx as unknown as Tx, "board", actor, withComment, { comments: [{ id: "comment", delete: true }] }, vi.fn());
    expect(tx.comment.delete).toHaveBeenCalledWith({ where: { id: "comment" } });
  });
  it("notifies each ticket participant once when adding a comment, excluding the actor", async () => {
    const tx = transaction();
    await applyTicketRelations(tx as unknown as Tx, "board", actor, { ...task, assigneeId: "mario", qaId: "mario", collaborators: [{ userId: "actor" }] }, { comments: [{ content: "Hello" }] }, vi.fn());
    expect(tx.comment.create).toHaveBeenCalledOnce(); expect(tx.notification.create).toHaveBeenCalledOnce();
  });
  it("uploads private bounded files and tracks cleanup without storing base64 in snapshots", async () => {
    const tx = transaction(); const uploaded: string[] = [];
    const patch = parseRelationPatch({ attachments: [{ filename: "test.txt", contentBase64: "aGVsbG8=" }] });
    await applyTicketRelations(tx as unknown as Tx, "board", actor, task, patch, vi.fn(), uploaded);
    expect(put).toHaveBeenCalledWith("attachments/ticket/test.txt", Buffer.from("hello"), { access: "private", addRandomSuffix: true });
    expect(tx.attachment.create).toHaveBeenCalledWith({ data: { taskId: "ticket", filename: "test.txt", size: 5, url: uploaded[0] } });
    await cleanupTicketUploads(uploaded); expect(del).toHaveBeenCalledWith(uploaded[0]);
    for (const row of [{ filename: "../test", contentBase64: "" }, { filename: "test", contentBase64: "invalid?" }, { id: "existing", filename: "test", contentBase64: "" }]) expect(() => parseRelationPatch({ attachments: [row] })).toThrow();
  });
  it("detects later nested relation edits in revert snapshots", () => {
    const snapshot = taskSnapshot({ ...task, description: null, listId: "list", order: 0, completed: false, completedAt: null, completedById: null, archived: false, archivedAt: null, priority: null, startDate: null, dueDate: null, updatedAt: new Date(), epicId: null, quarter: null });
    expect(snapshotsMatch(snapshot, { ...snapshot, customValues: [{ customFieldId: "env", value: "production" }] })).toBe(false);
    expect(snapshotsMatch(snapshot, JSON.parse(JSON.stringify(snapshot)))).toBe(true);
  });
});
