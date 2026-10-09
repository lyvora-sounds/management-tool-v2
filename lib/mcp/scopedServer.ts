import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import db from "@/lib/db";
import type { ExternalAccessContext } from "@/lib/externalAccess";
import { createMcpTicket, updateMcpTickets, listMcpChanges, revertMcpChange, McpWriteError } from "./writes";

const PRIORITIES = new Set(["urgent", "high", "medium", "low"]);
const taskChangesSchema = { type: "object", additionalProperties: false, properties: {
  title: { type: "string", maxLength: 500 }, description: { type: ["string", "null"], maxLength: 50000 },
  priority: { type: ["string", "null"], enum: ["urgent", "high", "medium", "low", null] },
  listId: { type: "string" }, completed: { type: "boolean" }, archived: { type: "boolean" },
  startDate: { type: ["string", "null"] }, dueDate: { type: ["string", "null"] },
} };
const writeMetadata = {
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
  securitySchemes: [{ type: "oauth2", scopes: ["tickets:read", "tickets:write"] }],
  _meta: { securitySchemes: [{ type: "oauth2", scopes: ["tickets:read", "tickets:write"] }] },
};

function text(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function ticketScope(context: ExternalAccessContext) {
  return context.boardId
    ? { list: { boardId: context.boardId } }
    : { list: { board: { organizationId: context.organizationId } } };
}

function toTicketDetail(task: {
  labels: { label: { id: string; title: string; color: string } }[];
  customValues: {
    value: string | null;
    customField: { name: string; defaultKey: string | null; type: string };
  }[];
}) {
  const { labels, customValues, ...ticket } = task;
  return {
    ...ticket,
    labels: labels.map((row) => row.label),
    customFields: customValues.map((row) => ({
      name: row.customField.name,
      key: row.customField.defaultKey,
      type: row.customField.type,
      value: row.value,
    })),
  };
}

const listSelect = {
  id: true,
  title: true,
  board: { select: { id: true, title: true } },
} as const;

export function createScopedMcpServer(context: ExternalAccessContext) {
  const server = new Server(
    { name: "kikiboard", version: "1.1.0" },
    { capabilities: { tools: {} } },
  );
  const scopeDescription = context.boardId
    ? "the single board bound to this connection"
    : "every board in the organization bound to this connection";

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "get_project",
        securitySchemes: [{ type: "oauth2", scopes: ["tickets:read"] }],
        annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
        _meta: { securitySchemes: [{ type: "oauth2", scopes: ["tickets:read"] }] },
        description: `Get ${scopeDescription}.`,
        inputSchema: { type: "object", additionalProperties: false, properties: {} },
      },
      {
        name: "list_tickets",
        securitySchemes: [{ type: "oauth2", scopes: ["tickets:read"] }],
        annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
        _meta: { securitySchemes: [{ type: "oauth2", scopes: ["tickets:read"] }] },
        description: `List tickets on ${scopeDescription}.`,
        inputSchema: {
          type: "object",
          additionalProperties: false,
          properties: {
            status: { type: "string", enum: ["all", "pending", "completed"] },
            priority: { type: "string", enum: ["urgent", "high", "medium", "low"] },
            archived: { type: "boolean", default: false },
            query: { type: "string", description: "Case-insensitive title search" },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 50 },
          },
        },
      },
      {
        name: "get_ticket",
        securitySchemes: [{ type: "oauth2", scopes: ["tickets:read"] }],
        annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
        _meta: { securitySchemes: [{ type: "oauth2", scopes: ["tickets:read"] }] },
        description: `Get one ticket by ID when it belongs to ${scopeDescription}.`,
        inputSchema: {
          type: "object",
          additionalProperties: false,
          required: ["ticketId"],
          properties: { ticketId: { type: "string" } },
        },
      },
      {
        name: "get_change_history", description: "List the latest 50 MCP task operations in this connection, including change IDs and revert status.",
        securitySchemes: [{ type: "oauth2", scopes: ["tickets:read"] }],
        _meta: { securitySchemes: [{ type: "oauth2", scopes: ["tickets:read"] }] },
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true },
      },
      ...(context.scopes.includes("tickets:write") ? [
        { name: "create_ticket", description: "Create a ticket in a list in this connection. Returns a change ID; reverting creation archives the ticket and preserves its content.", ...writeMetadata,
          inputSchema: { type: "object", additionalProperties: false, required: ["title", "listId"], properties: { title: { type: "string", maxLength: 500 }, listId: { type: "string" }, description: { type: "string", maxLength: 50000 }, priority: { type: "string", enum: ["urgent", "high", "medium", "low"] }, summary: { type: "string", maxLength: 500 } } } },
        { name: "update_tickets", description: "Edit, move, complete or archive up to 50 tickets on one board atomically. Every batch has a change ID and before/after history. Assignment and permanent deletion are not supported.", ...writeMetadata,
          inputSchema: { type: "object", additionalProperties: false, required: ["updates"], properties: { updates: { type: "array", minItems: 1, maxItems: 50, items: { type: "object", required: ["ticketId", "changes"], additionalProperties: false, properties: { ticketId: { type: "string" }, changes: taskChangesSchema } } }, summary: { type: "string", maxLength: 500 } } } },
        { name: "revert_change", description: "Preview undo with confirm=false first. After user approval, set confirm=true to revert an entire MCP change. Conflicts with later task edits reject the whole revert. Creation is undone by archiving.", ...writeMetadata,
          inputSchema: { type: "object", additionalProperties: false, required: ["changeId"], properties: { changeId: { type: "string" }, confirm: { type: "boolean", default: false } } } },
      ] : []),
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async ({ params }) => {
    const args = (params.arguments ?? {}) as Record<string, unknown>;
    if (["create_ticket", "update_tickets", "get_change_history", "revert_change"].includes(params.name)) {
      try {
        if (params.name === "get_change_history") return text(await listMcpChanges(context));
        if (!context.scopes.includes("tickets:write")) throw new McpWriteError("This connection is read-only");
        if (params.name === "create_ticket") return text(await createMcpTicket(context, args));
        if (params.name === "update_tickets") return text(await updateMcpTickets(context, args));
        if (typeof args.changeId !== "string" || !args.changeId) throw new McpWriteError("changeId is required");
        return text(await revertMcpChange(context, args.changeId, args.confirm === true));
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: error instanceof McpWriteError ? error.message : "The operation could not be completed. Refresh ticket data before retrying." }] };
      }
    }

    if (params.name === "get_project") {
      if (context.boardId) {
        const board = await db.board.findUnique({
          where: { id: context.boardId },
          select: {
            id: true,
            title: true,
            description: true,
            organizationId: true,
            list: { orderBy: { order: "asc" }, select: { id: true, title: true } },
          },
        });
        if (!board || board.organizationId !== context.organizationId) {
          return { isError: true, content: [{ type: "text", text: "Board not found" }] };
        }
        return text({ scope: "board", board });
      }

      const organization = await db.organization.findUnique({
        where: { id: context.organizationId },
        select: {
          id: true,
          name: true,
          description: true,
          boards: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              title: true,
              description: true,
              list: { orderBy: { order: "asc" }, select: { id: true, title: true } },
            },
          },
        },
      });
      if (!organization) {
        return { isError: true, content: [{ type: "text", text: "Organization not found" }] };
      }
      return text({ scope: "organization", organization });
    }

    if (params.name === "list_tickets") {
      const status = args.status === "pending" || args.status === "completed" ? args.status : "all";
      const limit = typeof args.limit === "number" ? Math.max(1, Math.min(100, args.limit)) : 50;
      const priority = typeof args.priority === "string" && PRIORITIES.has(args.priority)
        ? args.priority
        : undefined;
      const tasks = await db.task.findMany({
        where: {
          ...ticketScope(context),
          archived: args.archived === true,
          ...(status === "pending" ? { completed: false } : {}),
          ...(status === "completed" ? { completed: true } : {}),
          ...(priority ? { priority } : {}),
          ...(typeof args.query === "string" && args.query.trim()
            ? { title: { contains: args.query.trim(), mode: "insensitive" as const } }
            : {}),
        },
        orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
        take: limit,
        select: {
          id: true,
          title: true,
          completed: true,
          priority: true,
          startDate: true,
          dueDate: true,
          quarter: true,
          updatedAt: true,
          list: { select: listSelect },
        },
      });
      return text(tasks.map(({ list, ...task }) => ({
        ...task,
        board: list.board,
        list: { id: list.id, title: list.title },
      })));
    }

    if (params.name === "get_ticket") {
      if (typeof args.ticketId !== "string" || !args.ticketId) {
        return { isError: true, content: [{ type: "text", text: "ticketId is required" }] };
      }
      const task = await db.task.findFirst({
        where: {
          id: args.ticketId,
          ...ticketScope(context),
        },
        select: {
          id: true,
          title: true,
          description: true,
          completed: true,
          priority: true,
          startDate: true,
          dueDate: true,
          archived: true,
          quarter: true,
          createdAt: true,
          updatedAt: true,
          list: { select: listSelect },
          epic: { select: { id: true, title: true } },
          labels: { select: { label: { select: { id: true, title: true, color: true } } } },
          customValues: {
            select: {
              value: true,
              customField: { select: { name: true, defaultKey: true, type: true } },
            },
          },
        },
      });
      if (!task) {
        return { isError: true, content: [{ type: "text", text: "Ticket not found" }] };
      }
      const { list, ...ticket } = task;
      return text({
        ...toTicketDetail(ticket),
        board: list.board,
        list: { id: list.id, title: list.title },
      });
    }

    return { isError: true, content: [{ type: "text", text: "Unknown tool" }] };
  });

  return server;
}
