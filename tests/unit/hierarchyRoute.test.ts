import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const findUser = vi.fn();
const getBoardRole = vi.fn();
const findTask = vi.fn();
const findTasks = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({ auth: (...args: unknown[]) => auth(...args) }));
vi.mock("@/lib/boardAccess", () => ({ getBoardRole: (...args: unknown[]) => getBoardRole(...args) }));
vi.mock("@/lib/db", () => ({
  default: {
    user: { findUnique: (...args: unknown[]) => findUser(...args) },
    task: {
      findFirst: (...args: unknown[]) => findTask(...args),
      findMany: (...args: unknown[]) => findTasks(...args),
    },
  },
}));

const { GET } = await import("@/app/api/boards/[boardId]/hierarchy/route");

function request(taskId?: string) {
  const query = taskId ? `?taskId=${encodeURIComponent(taskId)}` : "";
  return new Request(`https://kikiboard.test/api/boards/board-1/hierarchy${query}`);
}

const params = Promise.resolve({ boardId: "board-1" });

function field(defaultKey: "parent" | "child", value: string | null) {
  return { value, customField: { defaultKey } };
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ userId: "clerk-1" });
  findUser.mockResolvedValue({ id: "user-1" });
  getBoardRole.mockResolvedValue("member");
  findTask.mockResolvedValue({ id: "child" });
  findTasks.mockResolvedValue([]);
});

describe("hierarchy route", () => {
  it("rejects a signed-out caller and a caller without board access", async () => {
    auth.mockResolvedValue({ userId: null });
    expect((await GET(request("child"), { params })).status).toBe(401);
    expect(findTask).not.toHaveBeenCalled();

    auth.mockResolvedValue({ userId: "clerk-1" });
    getBoardRole.mockResolvedValue(null);
    expect((await GET(request("child"), { params })).status).toBe(403);
    expect(findTask).not.toHaveBeenCalled();
  });

  it("requires a task on this board", async () => {
    expect((await GET(request(), { params })).status).toBe(400);
    findTask.mockResolvedValue(null);
    expect((await GET(request("other-board-task"), { params })).status).toBe(404);
    expect(findTask.mock.calls[0][0].where).toEqual({ id: "other-board-task", list: { boardId: "board-1" } });
    expect(findTasks).not.toHaveBeenCalled();
  });

  it("keeps an archived ancestor in the path", async () => {
    findTasks.mockResolvedValue([
      {
        id: "root",
        title: "Archived root",
        archived: true,
        customValues: [field("parent", null), field("child", JSON.stringify(["child"]))],
      },
      {
        id: "child",
        title: "Active step",
        archived: false,
        customValues: [field("parent", "root"), field("child", null)],
      },
    ]);

    const response = await GET(request("child"), { params });
    expect(response.status).toBe(200);
    expect(findTasks.mock.calls[0][0].where).toEqual({ list: { boardId: "board-1" } });
    const body = await response.json();
    expect(body.svg).toContain("Archived root");
    expect(body.svg).toContain('data-id="child"');
  });
});
