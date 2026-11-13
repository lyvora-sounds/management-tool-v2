import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findFirstConn: vi.fn(),
  findFirstBoard: vi.fn(),
  findFirstTask: vi.fn(),
  findFirstActivity: vi.fn(),
  transaction: vi.fn(),
  recordTaskStateTransition: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  default: {
    organizationGithubConnection: { findFirst: mocks.findFirstConn },
    board: { findFirst: mocks.findFirstBoard },
    task: { findFirst: mocks.findFirstTask },
    activityLog: { findFirst: mocks.findFirstActivity },
    $transaction: mocks.transaction,
  },
}));

vi.mock("@/lib/transitions", () => ({
  recordTaskStateTransition: mocks.recordTaskStateTransition,
}));

vi.mock("@/lib/statusTheme", () => ({
  nextListAfterMerge: () => ({ listId: "l-done", complete: true }),
}));

vi.mock("@/lib/integrations/ticketBranch", () => ({
  ticketIdentityFromBranch: () => ({ boardKey: "KI", number: 63 }),
}));

import { applyGithubWebhookEffect } from "@/lib/integrations/githubConnection";

describe("GitHub PR-merge auto-move audit trail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findFirstConn.mockResolvedValue({ organizationId: "o1", connectedById: "u1" });
    mocks.findFirstBoard.mockResolvedValue({
      id: "b1",
      userId: "u-owner",
      list: [
        { id: "l-review", title: "To Review", order: 1 },
        { id: "l-done", title: "Done", order: 2 },
      ],
    });
    mocks.findFirstTask.mockResolvedValue({
      id: "t1",
      listId: "l-review",
      completed: false,
      createdAt: new Date("2026-11-01T00:00:00.000Z"),
      assigneeId: "u1",
      list: { title: "To Review" },
    });
    mocks.findFirstActivity.mockResolvedValue(null);
    mocks.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        activityLog: {
          findFirst: async () => null,
          create: vi.fn(async () => ({})),
        },
        task: {
          update: vi.fn(async () => ({})),
        },
      };
      return fn(tx);
    });
  });

  it("records TaskStateTransition when a merge advances the ticket list", async () => {
    await applyGithubWebhookEffect({
      action: "pull-request-merged",
      installationId: "1",
      repositoryId: "r1",
      pullRequestId: "99",
      headRef: "KI-00063-x",
    });

    expect(mocks.recordTaskStateTransition).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        taskId: "t1",
        boardId: "b1",
        fromListId: "l-review",
        fromListTitle: "To Review",
        toListId: "l-done",
        toListTitle: "Done",
        movedById: "u1",
        completedAfterMove: true,
      }),
    );
  });
});
