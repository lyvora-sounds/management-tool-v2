import { describe, expect, it } from "vitest";
import { boardFromApi } from "@/lib/api/boards";
import type { ApiBoard } from "@/lib/api/types";

const wire: ApiBoard = {
  id: "b1",
  title: "Plan",
  description: "d",
  color: "#fff",
  links: [{ id: "k1", label: "Docs", url: "https://example.com" }],
  memberCanAssign: true,
  kikiMode: "owner",
  kikiTriage: false,
  accessMode: "organization",
  defaultRole: "member",
  notifyOnTaskCreated: true,
  notifyOnTaskCompleted: true,
  notifyOnTaskMoved: false,
  userId: "u1",
  organizationId: "o1",
  createdAt: "2026-10-27T09:00:00.000Z",
  updatedAt: "2026-10-27T09:30:00.000Z",
};

describe("boardFromApi", () => {
  it("turns the wire board into the model the boards store holds", () => {
    const board = boardFromApi(wire);
    expect(board).toMatchObject({ id: "b1", title: "Plan", color: "#fff", userId: "u1", organizationId: "o1", kikiMode: "owner" });
    expect(board.createdAt).toEqual(new Date("2026-10-27T09:00:00.000Z"));
    expect(board.updatedAt).toBeInstanceOf(Date);
    expect(board.links).toEqual(wire.links);
  });

  it("never carries a webhook URL: the API does not send them", () => {
    const board = boardFromApi(wire);
    expect(board.slackWebhookUrl).toBeNull();
    expect(board.discordWebhookUrl).toBeNull();
  });

  it("keeps a board with no links and no description", () => {
    const board = boardFromApi({ ...wire, links: null, description: null, color: null });
    expect(board.links).toBeNull();
    expect(board.description).toBeNull();
  });
});
