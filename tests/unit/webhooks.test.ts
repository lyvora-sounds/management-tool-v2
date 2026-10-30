import { beforeEach, describe, expect, it, vi } from "vitest";

const findBoard = vi.fn();
vi.mock("@/lib/db", () => ({ default: { board: { findUnique: (...args: unknown[]) => findBoard(...args) } } }));

const { isDiscordWebhookUrl, isSlackWebhookUrl, sendBoardWebhookNotification } = await import("@/lib/notifications/webhooks");

const board = (over: object) => ({
  title: "Plan",
  slackWebhookUrl: null,
  discordWebhookUrl: null,
  notifyOnTaskCreated: true,
  notifyOnTaskCompleted: true,
  notifyOnTaskMoved: true,
  ...over,
});
const event = { boardId: "b1", eventType: "task_completed" as const, taskTitle: "Ship" };

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.restoreAllMocks();
  fetchMock = vi.fn(async () => new Response("ok"));
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("webhook addresses", () => {
  it("accepts only https addresses on Slack or Discord", () => {
    expect(isSlackWebhookUrl("https://hooks.slack.com/services/T/B/x")).toBe(true);
    expect(isDiscordWebhookUrl("https://discord.com/api/webhooks/1/abc")).toBe(true);
    expect(isDiscordWebhookUrl("https://canary.discord.com/api/webhooks/1/abc")).toBe(true);
    for (const url of [
      "http://hooks.slack.com/x",
      "https://hooks.slack.com.evil.test/x",
      "https://evil.test/hooks.slack.com",
      "https://user:pw@hooks.slack.com/x",
      "http://169.254.169.254/latest",
      "https://localhost/x",
      "garbage",
    ]) {
      expect(isSlackWebhookUrl(url)).toBe(false);
    }
    expect(isDiscordWebhookUrl("https://hooks.slack.com/services/T/B/x")).toBe(false);
  });
});

describe("sending a notification", () => {
  it("posts to Slack and Discord addresses, refusing redirects", async () => {
    findBoard.mockResolvedValue(board({ slackWebhookUrl: "https://hooks.slack.com/services/T/B/x", discordWebhookUrl: "https://discord.com/api/webhooks/1/abc" }));
    await sendBoardWebhookNotification(event);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map((c) => (c[1] as RequestInit).redirect)).toEqual(["error", "error"]);
  });

  it("does not call an address stored before the check that is not on Slack or Discord", async () => {
    findBoard.mockResolvedValue(board({ slackWebhookUrl: "http://169.254.169.254/latest/meta-data", discordWebhookUrl: "https://internal.local/hook" }));
    await sendBoardWebhookNotification(event);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("still sends to the valid one when the other is refused", async () => {
    findBoard.mockResolvedValue(board({ slackWebhookUrl: "http://10.0.0.1/x", discordWebhookUrl: "https://discord.com/api/webhooks/1/abc" }));
    await sendBoardWebhookNotification(event);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]![0]).toBe("https://discord.com/api/webhooks/1/abc");
  });
});
