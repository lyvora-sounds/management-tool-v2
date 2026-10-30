import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const canEditBoard = vi.fn();
const canReadBoard = vi.fn();
const isBoardAdmin = vi.fn();
const db = {
  user: { findUnique: vi.fn() },
  task: { findUnique: vi.fn(), update: vi.fn() },
  taskCollaborator: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
  taskLabel: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
  label: { findUnique: vi.fn() },
  epic: { findFirst: vi.fn() },
  list: { findFirst: vi.fn() },
  notification: { create: vi.fn() },
};

vi.mock("@clerk/nextjs/server", () => ({ auth: (...args: unknown[]) => auth(...args) }));
vi.mock("@/lib/boardAccess", () => ({
  canEditBoard: (...args: unknown[]) => canEditBoard(...args),
  canReadBoard: (...args: unknown[]) => canReadBoard(...args),
  isBoardAdmin: (...args: unknown[]) => isBoardAdmin(...args),
}));
vi.mock("@/lib/db", () => ({ default: db }));
vi.mock("@/lib/createActivity", () => ({ createActivity: vi.fn() }));
vi.mock("@/lib/notifications/webhooks", () => ({ sendBoardWebhookNotification: vi.fn() }));

const assignee = await import("@/app/api/tasks/[taskId]/assignee/route");
const qa = await import("@/app/api/tasks/[taskId]/qa/route");
const collaborators = await import("@/app/api/tasks/[taskId]/collaborators/route");
const labels = await import("@/app/api/tasks/[taskId]/labels/route");
const updateTask = await import("@/app/api/tasks/updateTask/[taskId]/route");

const params = Promise.resolve({ taskId: "t1" });
const send = (method: string, body: unknown) => new Request("https://kikiboard.test/x", { method, body: JSON.stringify(body) });
const task = {
  id: "t1",
  title: "Ship",
  assigneeId: null,
  qaId: null,
  listId: "l1",
  completed: false,
  list: { id: "l1", title: "To do", board: { id: "b1", memberCanAssign: true } },
};

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ userId: "clerk-1" });
  db.user.findUnique.mockResolvedValue({ id: "me", name: "Me", email: "me@x.test" });
  db.task.findUnique.mockResolvedValue(task);
  db.task.update.mockResolvedValue({ ...task, assigneeId: "p1", qaId: "p1", assignee: null, qa: null, list: task.list, labels: [], collaborators: [] });
  canEditBoard.mockResolvedValue(true);
  canReadBoard.mockResolvedValue(true);
  isBoardAdmin.mockResolvedValue(true);
  db.taskCollaborator.findUnique.mockResolvedValue(null);
  db.taskLabel.findUnique.mockResolvedValue(null);
});

describe("choosing a person for a ticket", () => {
  it("assigns someone who can open the board", async () => {
    const res = await assignee.POST(send("POST", { assigneeId: "p1" }), { params });
    expect(res.status).toBe(200);
    expect(canReadBoard).toHaveBeenCalledWith("p1", "b1");
    expect(db.task.update).toHaveBeenCalled();
  });

  it("refuses an assignee with no access to the board, without notifying or writing", async () => {
    canReadBoard.mockResolvedValue(false);
    const res = await assignee.POST(send("POST", { assigneeId: "stranger" }), { params });
    expect(res.status).toBe(400);
    expect(db.task.update).not.toHaveBeenCalled();
    expect(db.notification.create).not.toHaveBeenCalled();
  });

  it("lets the current assignee be taken off even if they lost access", async () => {
    canReadBoard.mockResolvedValue(false);
    db.task.findUnique.mockResolvedValue({ ...task, assigneeId: "gone" });
    const res = await assignee.POST(send("POST", { assigneeId: "gone" }), { params });
    expect(res.status).toBe(200);
    expect(db.task.update.mock.calls[0]![0].data).toEqual({ assigneeId: null });
  });

  it("refuses a QA with no access to the board", async () => {
    canReadBoard.mockResolvedValue(false);
    const res = await qa.POST(send("POST", { qaId: "stranger" }), { params });
    expect(res.status).toBe(400);
    expect(db.task.update).not.toHaveBeenCalled();
  });

  it("refuses a collaborator with no access, or one that does not exist", async () => {
    db.user.findUnique.mockResolvedValueOnce({ id: "me", name: "Me", email: "me@x.test" }).mockResolvedValueOnce({ name: "P", email: "p@x.test" });
    canReadBoard.mockResolvedValue(false);
    expect((await collaborators.POST(send("POST", { collaboratorId: "stranger" }), { params })).status).toBe(400);
    db.user.findUnique.mockResolvedValueOnce({ id: "me", name: "Me", email: "me@x.test" }).mockResolvedValueOnce(null);
    canReadBoard.mockResolvedValue(true);
    expect((await collaborators.POST(send("POST", { collaboratorId: "nobody" }), { params })).status).toBe(400);
    expect(db.taskCollaborator.create).not.toHaveBeenCalled();
  });

  it("removes a collaborator without checking their access", async () => {
    db.taskCollaborator.findUnique.mockResolvedValue({ taskId: "t1", userId: "gone" });
    canReadBoard.mockResolvedValue(false);
    const res = await collaborators.POST(send("POST", { collaboratorId: "gone" }), { params });
    expect(res.status).toBe(200);
    expect(db.taskCollaborator.delete).toHaveBeenCalled();
  });
});

describe("attaching a label or an epic from another board", () => {
  it("refuses a label that belongs to another board", async () => {
    db.label.findUnique.mockResolvedValue({ boardId: "other" });
    const res = await labels.POST(send("POST", { labelId: "lab" }), { params });
    expect(res.status).toBe(404);
    expect(db.taskLabel.create).not.toHaveBeenCalled();
  });

  it("attaches a label of the same board and lets one be taken off", async () => {
    db.label.findUnique.mockResolvedValue({ boardId: "b1" });
    expect((await (await labels.POST(send("POST", { labelId: "lab" }), { params })).json()).active).toBe(true);
    db.taskLabel.findUnique.mockResolvedValue({ taskId: "t1", labelId: "old" });
    expect((await (await labels.POST(send("POST", { labelId: "old" }), { params })).json()).active).toBe(false);
  });

  it("refuses an epic of another board and a person with no access, before writing", async () => {
    db.epic.findFirst.mockResolvedValue(null);
    expect((await updateTask.PATCH(send("PATCH", { epicId: "foreign" }), { params })).status).toBe(400);
    expect(db.epic.findFirst).toHaveBeenCalledWith({ where: { id: "foreign", boardId: "b1" }, select: { id: true } });
    canReadBoard.mockResolvedValue(false);
    expect((await updateTask.PATCH(send("PATCH", { assigneeId: "stranger" }), { params })).status).toBe(400);
    expect((await updateTask.PATCH(send("PATCH", { qaId: "stranger" }), { params })).status).toBe(400);
    expect(db.task.update).not.toHaveBeenCalled();
  });

  it("still clears the epic, the assignee and the QA with null", async () => {
    canReadBoard.mockResolvedValue(false);
    const res = await updateTask.PATCH(send("PATCH", { epicId: null, assigneeId: null, qaId: "" }), { params });
    expect(res.status).toBe(200);
    expect(db.epic.findFirst).not.toHaveBeenCalled();
  });
});
