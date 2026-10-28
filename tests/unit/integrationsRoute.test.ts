import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const isBoardAdmin = vi.fn();
const findBoard = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({ auth: (...args: unknown[]) => auth(...args) }));
vi.mock("@/lib/boardAccess", () => ({ isBoardAdmin: (...args: unknown[]) => isBoardAdmin(...args) }));
vi.mock("@/lib/db", () => ({ default: { board: { findUnique: (...args: unknown[]) => findBoard(...args) } } }));

const { GET } = await import("@/app/api/boards/[boardId]/integrations/route");

const params = Promise.resolve({ boardId: "board-1" });
const request = () => new Request("https://kikiboard.test/api/boards/board-1/integrations");
const stored = { slackWebhookUrl: "https://hooks.slack.com/services/T/B/x", discordWebhookUrl: null };

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ userId: "clerk-1" });
  isBoardAdmin.mockResolvedValue(true);
  findBoard.mockResolvedValue(stored);
});

describe("integrations route, reading", () => {
  it("gives the webhook URLs to an owner or admin", async () => {
    const res = await GET(request(), { params });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(stored);
  });

  it("refuses everyone else, whatever they can edit, without reading the board", async () => {
    isBoardAdmin.mockResolvedValue(false);
    const res = await GET(request(), { params });
    expect(res.status).toBe(403);
    expect(JSON.stringify(await res.json())).not.toContain("hooks.slack.com");
    expect(findBoard).not.toHaveBeenCalled();
  });

  it("refuses a signed-out caller", async () => {
    auth.mockResolvedValue({ userId: null });
    expect((await GET(request(), { params })).status).toBe(401);
  });
});
