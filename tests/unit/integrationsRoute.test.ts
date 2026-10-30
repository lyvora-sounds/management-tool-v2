import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const isBoardAdmin = vi.fn();
const findBoard = vi.fn();
const updateBoard = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({ auth: (...args: unknown[]) => auth(...args) }));
vi.mock("@/lib/boardAccess", () => ({ isBoardAdmin: (...args: unknown[]) => isBoardAdmin(...args) }));
vi.mock("@/lib/db", () => ({ default: { board: { findUnique: (...args: unknown[]) => findBoard(...args), update: (...args: unknown[]) => updateBoard(...args) } } }));

const { GET, PATCH } = await import("@/app/api/boards/[boardId]/integrations/route");

const params = Promise.resolve({ boardId: "board-1" });
const request = () => new Request("https://kikiboard.test/api/boards/board-1/integrations");
const stored = { slackWebhookUrl: "https://hooks.slack.com/services/T/B/x", discordWebhookUrl: null };

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ userId: "clerk-1" });
  isBoardAdmin.mockResolvedValue(true);
  findBoard.mockResolvedValue(stored);
  updateBoard.mockResolvedValue(stored);
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

describe("integrations route, writing", () => {
  const patch = (body: unknown) =>
    PATCH(new Request("https://kikiboard.test/api/boards/board-1/integrations", { method: "PATCH", body: JSON.stringify(body) }), { params });

  it("stores a Slack and a Discord address", async () => {
    const res = await patch({
      slackWebhookUrl: " https://hooks.slack.com/services/T/B/x ",
      discordWebhookUrl: "https://discord.com/api/webhooks/1/abc",
    });
    expect(res.status).toBe(200);
    expect(updateBoard.mock.calls[0]![0].data).toMatchObject({
      slackWebhookUrl: "https://hooks.slack.com/services/T/B/x",
      discordWebhookUrl: "https://discord.com/api/webhooks/1/abc",
    });
  });

  it("refuses an address that is not Slack or Discord, and writes nothing", async () => {
    for (const body of [
      { slackWebhookUrl: "http://169.254.169.254/latest/meta-data" },
      { slackWebhookUrl: "https://hooks.slack.com.evil.test/x" },
      { slackWebhookUrl: "http://hooks.slack.com/services/T/B/x" },
      { slackWebhookUrl: "https://user:pw@hooks.slack.com/services/T/B/x" },
      { slackWebhookUrl: "https://discord.com/api/webhooks/1/abc" },
      { discordWebhookUrl: "https://hooks.slack.com/services/T/B/x" },
      { discordWebhookUrl: "https://internal.local/hook" },
      { discordWebhookUrl: "not a url" },
    ]) {
      expect((await patch(body)).status).toBe(400);
    }
    expect(updateBoard).not.toHaveBeenCalled();
  });

  it("clears an integration with an empty value", async () => {
    expect((await patch({ slackWebhookUrl: "", discordWebhookUrl: null })).status).toBe(200);
    expect(updateBoard.mock.calls[0]![0].data).toMatchObject({ slackWebhookUrl: null, discordWebhookUrl: null });
  });

  it("is still for admins only", async () => {
    isBoardAdmin.mockResolvedValue(false);
    expect((await patch({ slackWebhookUrl: "https://hooks.slack.com/services/T/B/x" })).status).toBe(403);
    expect(updateBoard).not.toHaveBeenCalled();
  });
});
