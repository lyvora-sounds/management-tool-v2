import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

const findBoard = vi.fn();
const findTasks = vi.fn();
const findTask = vi.fn();

vi.mock("@/lib/db", () => ({
  default: {
    board: { findUnique: (...args: unknown[]) => findBoard(...args) },
    task: {
      findMany: (...args: unknown[]) => findTasks(...args),
      findFirst: (...args: unknown[]) => findTask(...args),
    },
  },
}));

const { createScopedMcpServer } = await import("@/lib/mcp/scopedServer");

const context = {
  tokenId: "token-1",
  boardId: "board-allowed",
  boardTitle: "Allowed project",
  scopes: ["tickets:read"],
  allEnvironments: false,
  environments: ["production"],
};

let client: Client;
let server: ReturnType<typeof createScopedMcpServer>;

beforeEach(async () => {
  findBoard.mockReset();
  findTasks.mockReset();
  findTask.mockReset();
  findTasks.mockResolvedValue([]);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  server = createScopedMcpServer(context);
  client = new Client({ name: "security-test", version: "1.0.0" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
});

afterEach(async () => {
  await client.close();
  await server.close();
});

describe("scoped MCP server", () => {
  it("completes the MCP handshake and never asks clients for a board id", async () => {
    const result = await client.listTools();
    expect(result.tools.map((tool) => tool.name)).toEqual([
      "get_project",
      "list_tickets",
      "get_ticket",
    ]);
    for (const tool of result.tools) {
      expect(tool.inputSchema.properties).not.toHaveProperty("boardId");
    }
  });

  it("always injects the credential board and environment into ticket queries", async () => {
    await client.callTool({ name: "list_tickets", arguments: { status: "pending" } });

    const where = findTasks.mock.calls[0][0].where;
    expect(where.list).toEqual({ boardId: "board-allowed" });
    expect(where.completed).toBe(false);
    expect(where.customValues.some).toEqual({
      customField: { boardId: "board-allowed", defaultKey: "environment" },
      value: { in: ["production"] },
    });
  });

  it("does not allow a ticket lookup to escape the credential scope", async () => {
    findTask.mockResolvedValue(null);
    await client.callTool({ name: "get_ticket", arguments: { ticketId: "foreign-ticket" } });

    expect(findTask.mock.calls[0][0].where).toMatchObject({
      id: "foreign-ticket",
      list: { boardId: "board-allowed" },
      customValues: {
        some: {
          customField: { boardId: "board-allowed", defaultKey: "environment" },
          value: { in: ["production"] },
        },
      },
    });
  });

  it("returns a ticket contract instead of the join-table shape", async () => {
    findTask.mockResolvedValue({
      id: "ticket-1",
      title: "Pay",
      labels: [{ label: { id: "label-1", title: "bug", color: "#f00" } }],
      customValues: [{
        value: "production",
        customField: { name: "Environment", defaultKey: "environment", type: "SELECT" },
      }],
    });

    const result = await client.callTool({ name: "get_ticket", arguments: { ticketId: "ticket-1" } });
    const content = result.content as { text: string }[];
    const body = JSON.parse(content[0].text);
    expect(body.labels).toEqual([{ id: "label-1", title: "bug", color: "#f00" }]);
    expect(body.customFields).toEqual([{
      name: "Environment",
      key: "environment",
      type: "SELECT",
      value: "production",
    }]);
    expect(body.customValues).toBeUndefined();
  });

  it("does not filter by environment when the credential grants every environment", async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const unrestricted = createScopedMcpServer({
      ...context,
      allEnvironments: true,
      environments: [],
    });
    const extra = new Client({ name: "security-test", version: "1.0.0" });
    await unrestricted.connect(serverTransport);
    await extra.connect(clientTransport);
    try {
      await extra.callTool({ name: "list_tickets", arguments: { priority: "nope" } });
      const where = findTasks.mock.calls[0][0].where;
      expect(where.list).toEqual({ boardId: "board-allowed" });
      expect(where.customValues).toBeUndefined();
      expect(where.priority).toBeUndefined();
    } finally {
      await extra.close();
      await unrestricted.close();
    }
  });
});
