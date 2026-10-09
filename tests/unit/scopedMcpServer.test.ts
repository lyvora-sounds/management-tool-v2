import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { ExternalAccessContext } from "@/lib/externalAccess";

const findBoard = vi.fn();
const findOrganization = vi.fn();
const findTasks = vi.fn();
const findTask = vi.fn();
const findFields = vi.fn();
const findAttachment = vi.fn();

vi.mock("@/lib/db", () => ({
  default: {
    customField: { findMany: (...args: unknown[]) => findFields(...args) },
    attachment: { findFirst: (...args: unknown[]) => findAttachment(...args) },
    user: { findMany: async () => [] },
    board: { findUnique: (...args: unknown[]) => findBoard(...args) },
    organization: { findUnique: (...args: unknown[]) => findOrganization(...args) },
    task: {
      findMany: (...args: unknown[]) => findTasks(...args),
      findFirst: (...args: unknown[]) => findTask(...args),
    },
  },
}));

const { createScopedMcpServer } = await import("@/lib/mcp/scopedServer");

const boardContext: ExternalAccessContext = {
  tokenId: "token-1",
  organizationId: "org-1",
  boardId: "board-allowed",
  boardTitle: "Allowed project",
  scopes: ["tickets:read"],
};

const organizationContext: ExternalAccessContext = {
  tokenId: "token-2",
  organizationId: "org-1",
  boardId: null,
  boardTitle: null,
  scopes: ["tickets:read"],
};

let client: Client;
let server: ReturnType<typeof createScopedMcpServer>;

async function connect(context: ExternalAccessContext) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const nextServer = createScopedMcpServer(context);
  const nextClient = new Client({ name: "security-test", version: "1.0.0" });
  await nextServer.connect(serverTransport);
  await nextClient.connect(clientTransport);
  return { client: nextClient, server: nextServer };
}

beforeEach(async () => {
  findBoard.mockReset();
  findOrganization.mockReset();
  findTasks.mockReset();
  findTask.mockReset();
  findTasks.mockResolvedValue([]);
  findFields.mockReset().mockResolvedValue([]);
  findAttachment.mockReset().mockResolvedValue(null);
  ({ client, server } = await connect(boardContext));
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
      "get_attachment",
      "get_change_history",
    ]);
    for (const tool of result.tools) {
      expect(tool.annotations?.readOnlyHint).toBe(true);
      expect(tool.inputSchema.properties).not.toHaveProperty("boardId");
      expect(JSON.stringify(tool.inputSchema)).not.toContain("environment");
    }
  });

  it("exposes mutation tools only for an explicitly writable connection", async () => {
    const extra = await connect({ ...boardContext, scopes: ["tickets:read", "tickets:write"] });
    try {
      const result = await extra.client.listTools();
      expect(result.tools.filter((tool) => tool.annotations?.readOnlyHint === false).map((tool) => tool.name)).toEqual(["create_ticket", "update_tickets", "revert_change"]);
      const readOnly = await client.callTool({ name: "update_tickets", arguments: { updates: [] } });
      expect(readOnly.isError).toBe(true);
    } finally {
      await extra.client.close(); await extra.server.close();
    }
  });

  it("limits a board credential to that board and does not filter by environment", async () => {
    await client.callTool({ name: "list_tickets", arguments: { status: "pending" } });

    const where = findTasks.mock.calls[0][0].where;
    expect(where.list).toEqual({ boardId: "board-allowed" });
    expect(where.completed).toBe(false);
    expect(where.customValues).toBeUndefined();
  });

  it("limits an organization credential to boards in that organization", async () => {
    const extra = await connect(organizationContext);
    try {
      await extra.client.callTool({ name: "list_tickets", arguments: {} });
      expect(findTasks.mock.calls[0][0].where.list).toEqual({
        board: { organizationId: "org-1" },
      });
      expect(findTasks.mock.calls[0][0].where.customValues).toBeUndefined();
    } finally {
      await extra.client.close();
      await extra.server.close();
    }
  });

  it("does not allow a ticket lookup to escape the credential scope", async () => {
    findTask.mockResolvedValue(null);
    await client.callTool({ name: "get_ticket", arguments: { ticketId: "foreign-ticket" } });

    expect(findTask.mock.calls[0][0].where).toEqual({
      id: "foreign-ticket",
      list: { boardId: "board-allowed" },
    });
  });

  it("returns a ticket contract instead of the join-table shape", async () => {
    findTask.mockResolvedValue({
      id: "ticket-1",
      title: "Pay",
      qaId: "mario", qa: { id: "mario", name: "Mario Ruby", email: "mario@test.invalid" },
      assigneeId: "daniel", assignee: { id: "daniel", name: "Daniel Alvarez", email: "daniel@test.invalid" },
      collaborators: [{ user: { id: "watcher", name: "Watcher", email: "watcher@test.invalid" } }],
      subtasks: [{ id: "subtask", title: "Verify", completed: false, order: 0 }],
      comments: [], attachments: [],
      list: { id: "list-1", title: "Doing", board: { id: "board-allowed", title: "Checkout" } },
      labels: [{ label: { id: "label-1", title: "bug", color: "#f00" } }],
      customValues: [{
        value: "production",
        customField: { name: "Environment", defaultKey: "environment", type: "SELECT" },
      }],
    });

    const result = await client.callTool({ name: "get_ticket", arguments: { ticketId: "ticket-1" } });
    const content = result.content as { text: string }[];
    const body = JSON.parse(content[0].text);
    expect(body.board).toEqual({ id: "board-allowed", title: "Checkout" });
    expect(body.list).toEqual({ id: "list-1", title: "Doing" });
    expect(body.labels).toEqual([{ id: "label-1", title: "bug", color: "#f00" }]);
    expect(body.customFields).toEqual([{
      name: "Environment",
      key: "environment",
      type: "SELECT",
      value: "production",
    }]);
    expect(body.customValues).toBeUndefined();
    expect(body.qa.name).toBe("Mario Ruby");
    expect(body.assignee.name).toBe("Daniel Alvarez");
    expect(body.collaborators[0].id).toBe("watcher");
    expect(body.subtasks[0].id).toBe("subtask");
  });

  it("exposes unset field definitions and options on ticket reads", async () => {
    findTask.mockResolvedValue({ id: "ticket", list: { id: "list", title: "Draft", board: { id: "board-allowed", title: "Board" } }, labels: [], customValues: [] });
    findFields.mockResolvedValue([{ id: "env", name: "Environment", defaultKey: "environment", type: "SELECT", options: ["production"], enabled: true }]);
    const result = await client.callTool({ name: "get_ticket", arguments: { ticketId: "ticket" } });
    const body = JSON.parse((result.content as { text: string }[])[0].text);
    expect(body.customFields[0]).toMatchObject({ id: "env", value: null, options: ["production"] });
    expect(findFields.mock.calls[0][0].where).toEqual({ boardId: "board-allowed" });
  });

  it("filters assignments by name/email and paginates inside the credential scope", async () => {
    await client.callTool({ name: "list_tickets", arguments: { person: "Daniel Alvarez", qaId: "mario", cursor: "last-ticket", limit: 10 } });
    expect(findTasks.mock.calls[0][0]).toMatchObject({ where: { list: { boardId: "board-allowed" }, qaId: "mario", assignee: { OR: [{ name: { contains: "Daniel Alvarez", mode: "insensitive" } }, { email: { contains: "Daniel Alvarez", mode: "insensitive" } }] } }, cursor: { id: "last-ticket" }, skip: 1, take: 10 });
  });

  it("scopes attachment reads by both ticket and connection", async () => {
    const result = await client.callTool({ name: "get_attachment", arguments: { ticketId: "ticket", attachmentId: "foreign" } });
    expect(result.isError).toBe(true);
    expect(findAttachment.mock.calls[0][0].where).toEqual({ id: "foreign", taskId: "ticket", task: { list: { boardId: "board-allowed" } } });
  });

  it("reads the bound board for get_project and refuses a board that left the organization", async () => {
    findBoard.mockResolvedValue({
      id: "board-allowed",
      title: "Checkout",
      description: null,
      organizationId: "org-other",
      list: [],
    });
    const result = await client.callTool({ name: "get_project", arguments: {} });
    expect(result.isError).toBe(true);
    expect(findBoard).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "board-allowed" },
    }));
    expect(findOrganization).not.toHaveBeenCalled();
  });

  it("reads every board in the organization for an organization credential", async () => {
    findOrganization.mockResolvedValue({
      id: "org-1",
      name: "Acme",
      description: null,
      boards: [{ id: "board-allowed", title: "Checkout", description: null, list: [] }],
    });
    const extra = await connect(organizationContext);
    try {
      const result = await extra.client.callTool({ name: "get_project", arguments: {} });
      const content = result.content as { text: string }[];
      const body = JSON.parse(content[0].text);
      expect(body.scope).toBe("organization");
      expect(body.organization.boards).toHaveLength(1);
      expect(findOrganization).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: "org-1" },
      }));
      expect(findBoard).not.toHaveBeenCalled();
    } finally {
      await extra.client.close();
      await extra.server.close();
    }
  });
});
