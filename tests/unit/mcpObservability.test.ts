import { beforeEach, describe, expect, it, vi } from "vitest";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const mockDb = vi.hoisted(() => ({
  board: {
    findFirst: vi.fn(),
  },
  task: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  taskStateTransition: {
    findMany: vi.fn(),
  },
  user: {
    findMany: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  default: mockDb,
}));

import { createScopedMcpServer } from "@/lib/mcp/scopedServer";

type Handler = (request: { method: string; params: Record<string, unknown> }) => Promise<{
  isError?: boolean;
  content: { type: string; text: string }[];
}>;

function getHandlers(server: ReturnType<typeof createScopedMcpServer>) {
  const internal = server as unknown as {
    _requestHandlers: Map<string, Handler>;
  };
  const rawList = internal._requestHandlers.get(ListToolsRequestSchema.shape.method.value)!;
  const rawCall = internal._requestHandlers.get(CallToolRequestSchema.shape.method.value)!;
  return {
    listTools: (req: { params: Record<string, unknown> }) =>
      rawList({ method: "tools/list", params: req.params }),
    callTool: (req: { params: Record<string, unknown> }) =>
      rawCall({ method: "tools/call", params: req.params }),
  };
}

describe("MCP Observability Tools: get_board_metrics & get_state_history (KI-00065)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers get_board_metrics and get_state_history in tools/list", async () => {
    const server = createScopedMcpServer({
      tokenId: "tok_1",
      organizationId: "org_1",
      boardId: "board_1",
      boardTitle: "Kiki",
      fullAccess: false,
      createdById: "user_1",
      scopes: ["tickets:read"],
    });
    const { listTools } = getHandlers(server);
    const res = (await listTools({ params: {} })) as unknown as {
      tools: { name: string }[];
    };
    const names = res.tools.map((t) => t.name);
    expect(names).toContain("get_board_metrics");
    expect(names).toContain("get_state_history");
  });

  it("enforces board scope boundary and returns velocity metrics on get_board_metrics", async () => {
    const server = createScopedMcpServer({
      tokenId: "tok_1",
      organizationId: "org_1",
      boardId: "board_1",
      boardTitle: "Kiki",
      fullAccess: false,
      createdById: "user_1",
      scopes: ["tickets:read"],
    });
    const { callTool } = getHandlers(server);

    // Attempt to query a different board on a board-scoped connection
    const denied = await callTool({
      params: {
        name: "get_board_metrics",
        arguments: { boardId: "board_other" },
      },
    });
    expect(denied.isError).toBe(true);

    // Valid board query
    mockDb.board.findFirst.mockResolvedValue({ id: "board_1" });
    mockDb.taskStateTransition.findMany.mockResolvedValue([
      {
        id: "tr_1",
        taskId: "task_1",
        boardId: "board_1",
        fromListId: "list_todo",
        fromListTitle: "To do",
        toListId: "list_done",
        toListTitle: "Done",
        movedById: "user_1",
        assigneeIdAtMove: "user_1",
        storyPointsAtMove: 8,
        completedAfterMove: true,
        durationMs: BigInt(3_600_000),
        transitionedAt: new Date("2026-11-12T10:00:00.000Z"),
      },
    ]);
    mockDb.task.findMany.mockResolvedValue([
      {
        id: "task_1",
        title: "Implement observability",
        createdAt: new Date("2026-11-10T10:00:00.000Z"),
        completed: true,
        completedAt: new Date("2026-11-12T10:00:00.000Z"),
        assigneeId: "user_1",
        collaborators: [],
        customValues: [{ value: "8" }],
      },
    ]);
    mockDb.user.findMany.mockResolvedValue([
      { id: "user_1", name: "Daniel Alvarez", email: "daniel@kikiboard.xyz" },
    ]);

    const ok = await callTool({
      params: {
        name: "get_board_metrics",
        arguments: { groupBy: "week" },
      },
    });
    expect(ok.isError).toBeUndefined();
    const payload = JSON.parse(ok.content[0]!.text) as {
      boardId: string;
      totals: { achievedPoints: number };
    };
    expect(payload.boardId).toBe("board_1");
    expect(payload.totals.achievedPoints).toBe(8);
  });

  it("returns chronological state transition history on get_state_history", async () => {
    const server = createScopedMcpServer({
      tokenId: "tok_1",
      organizationId: "org_1",
      boardId: "board_1",
      boardTitle: "Kiki",
      fullAccess: false,
      createdById: "user_1",
      scopes: ["tickets:read"],
    });
    const { callTool } = getHandlers(server);

    mockDb.task.findFirst.mockResolvedValueOnce({
      id: "task_1",
      list: { boardId: "board_1" },
    });
    mockDb.taskStateTransition.findMany.mockResolvedValueOnce([
      {
        id: "tr_1",
        taskId: "task_1",
        boardId: "board_1",
        fromListId: "list_todo",
        fromListTitle: "To do",
        toListId: "list_done",
        toListTitle: "Done",
        movedById: "user_1",
        assigneeIdAtMove: "user_1",
        storyPointsAtMove: 5,
        completedAfterMove: true,
        durationMs: BigInt(1_800_000),
        transitionedAt: new Date("2026-11-13T09:00:00.000Z"),
      },
    ]);
    mockDb.task.findMany.mockResolvedValueOnce([
      { id: "task_1", title: "Ticket 1" },
    ]);
    mockDb.user.findMany.mockResolvedValueOnce([
      { id: "user_1", name: "Daniel Alvarez", email: "daniel@kikiboard.xyz" },
    ]);

    const res = await callTool({
      params: {
        name: "get_state_history",
        arguments: { ticketId: "task_1" },
      },
    });
    expect(res.isError).toBeUndefined();
    const parsed = JSON.parse(res.content[0]!.text) as {
      boardId: string;
      ticketId: string;
      transitions: Array<{ storyPointsAtMove: number; toListTitle: string }>;
    };
    expect(parsed.boardId).toBe("board_1");
    expect(parsed.ticketId).toBe("task_1");
    expect(parsed.transitions).toHaveLength(1);
    expect(parsed.transitions[0]?.storyPointsAtMove).toBe(5);
    expect(parsed.transitions[0]?.toListTitle).toBe("Done");
  });
});
