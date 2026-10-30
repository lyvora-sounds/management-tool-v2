import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const canReadBoard = vi.fn();
const canEditBoard = vi.fn();
const findUser = vi.fn();
const findTask = vi.fn();
const updateTask = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({ auth: (...args: unknown[]) => auth(...args) }));
vi.mock("@/lib/boardAccess", () => ({
  canReadBoard: (...args: unknown[]) => canReadBoard(...args),
  canEditBoard: (...args: unknown[]) => canEditBoard(...args),
}));
vi.mock("@/lib/db", () => ({
  default: {
    user: { findUnique: (...args: unknown[]) => findUser(...args) },
    task: { findUnique: (...args: unknown[]) => findTask(...args), update: (...args: unknown[]) => updateTask(...args) },
  },
}));

const { GET, POST, DELETE } = await import("@/app/api/tasks/[taskId]/share/route");

const params = Promise.resolve({ taskId: "task-1" });
const request = (method: string) => new Request("https://kikiboard.test/api/tasks/task-1/share", { method });

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ userId: "clerk-1" });
  findUser.mockResolvedValue({ id: "user-1" });
  findTask.mockResolvedValue({ id: "task-1", shareToken: "tok", list: { boardId: "board-1" } });
  updateTask.mockResolvedValue({ shareToken: "tok" });
  canReadBoard.mockResolvedValue(true);
  canEditBoard.mockResolvedValue(true);
});

describe("ticket share route", () => {
  it("shows the link to someone who can read the board", async () => {
    const res = await GET(request("GET"), { params });
    expect(res.status).toBe(200);
    expect((await res.json()).shareToken).toBe("tok");
    expect(canReadBoard).toHaveBeenCalledWith("user-1", "board-1");
  });

  it("answers a stranger as if the ticket did not exist, without its token", async () => {
    canReadBoard.mockResolvedValue(false);
    const res = await GET(request("GET"), { params });
    expect(res.status).toBe(404);
    expect(JSON.stringify(await res.json())).not.toContain("tok");
  });

  it("does not let a stranger switch sharing on, and writes nothing", async () => {
    canEditBoard.mockResolvedValue(false);
    expect((await POST(request("POST"), { params })).status).toBe(404);
    expect(updateTask).not.toHaveBeenCalled();
  });

  it("does not let a reader who cannot edit switch sharing on or off", async () => {
    canEditBoard.mockResolvedValue(false);
    canReadBoard.mockResolvedValue(true);
    expect((await POST(request("POST"), { params })).status).toBe(404);
    expect((await DELETE(request("DELETE"), { params })).status).toBe(404);
    expect(updateTask).not.toHaveBeenCalled();
  });

  it("lets an editor switch sharing on, keeping the token it already has", async () => {
    const res = await POST(request("POST"), { params });
    expect(res.status).toBe(200);
    expect(updateTask).toHaveBeenCalledWith({ where: { id: "task-1" }, data: { shareToken: "tok" } });
  });

  it("lets an editor switch sharing off", async () => {
    const res = await DELETE(request("DELETE"), { params });
    expect(res.status).toBe(200);
    expect(updateTask).toHaveBeenCalledWith({ where: { id: "task-1" }, data: { shareToken: null } });
  });

  it("is 404 for a ticket that is not there and 401 when signed out", async () => {
    findTask.mockResolvedValue(null);
    expect((await DELETE(request("DELETE"), { params })).status).toBe(404);
    auth.mockResolvedValue({ userId: null });
    expect((await GET(request("GET"), { params })).status).toBe(401);
  });
});
