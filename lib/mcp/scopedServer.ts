import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import db from "@/lib/db";
import type { ExternalAccessContext } from "@/lib/externalAccess";

const PRIORITIES = new Set(["urgent", "high", "medium", "low"]);

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
        description: `Get ${scopeDescription}.`,
        inputSchema: { type: "object", additionalProperties: false, properties: {} },
      },
      {
        name: "list_tickets",
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
        description: `Get one ticket by ID when it belongs to ${scopeDescription}.`,
        inputSchema: {
          type: "object",
          additionalProperties: false,
          required: ["ticketId"],
          properties: { ticketId: { type: "string" } },
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async ({ params }) => {
    const args = (params.arguments ?? {}) as Record<string, unknown>;

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
