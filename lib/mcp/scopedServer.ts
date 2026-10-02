import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import db from "@/lib/db";
import type { ExternalAccessContext } from "@/lib/externalAccess";

function environmentWhere(context: ExternalAccessContext) {
  if (context.environments.includes("*")) return {};
  return {
    customValues: {
      some: {
        customField: { boardId: context.boardId, defaultKey: "environment" },
        value: { in: context.environments },
      },
    },
  };
}

function text(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

export function createScopedMcpServer(context: ExternalAccessContext) {
  const server = new Server(
    { name: "kikiboard", version: "1.1.0" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "get_project",
        description: "Get the single Kikiboard project bound to this connection.",
        inputSchema: { type: "object", additionalProperties: false, properties: {} },
      },
      {
        name: "list_tickets",
        description: "List tickets in the bound project and permitted environments.",
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
        description: "Get one ticket by ID if it belongs to the bound project and permitted environment.",
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
      const board = await db.board.findUnique({
        where: { id: context.boardId },
        select: {
          id: true,
          title: true,
          description: true,
          list: { orderBy: { order: "asc" }, select: { id: true, title: true } },
        },
      });
      return text({ ...board, permittedEnvironments: context.environments });
    }

    if (params.name === "list_tickets") {
      const status = typeof args.status === "string" ? args.status : "all";
      const limit = typeof args.limit === "number" ? Math.max(1, Math.min(100, args.limit)) : 50;
      const tasks = await db.task.findMany({
        where: {
          list: { boardId: context.boardId },
          archived: args.archived === true,
          ...(status === "pending" ? { completed: false } : {}),
          ...(status === "completed" ? { completed: true } : {}),
          ...(typeof args.priority === "string" ? { priority: args.priority } : {}),
          ...(typeof args.query === "string" && args.query.trim()
            ? { title: { contains: args.query.trim(), mode: "insensitive" as const } }
            : {}),
          ...environmentWhere(context),
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
          list: { select: { id: true, title: true } },
          customValues: {
            where: {
              customField: { boardId: context.boardId, defaultKey: "environment" },
            },
            select: { value: true },
            take: 1,
          },
        },
      });
      return text(tasks.map(({ customValues, ...task }) => ({
        ...task,
        environment: customValues[0]?.value ?? null,
      })));
    }

    if (params.name === "get_ticket") {
      if (typeof args.ticketId !== "string" || !args.ticketId) {
        return { isError: true, content: [{ type: "text", text: "ticketId is required" }] };
      }
      const task = await db.task.findFirst({
        where: {
          id: args.ticketId,
          list: { boardId: context.boardId },
          ...environmentWhere(context),
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
          list: { select: { id: true, title: true } },
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
      return text(task);
    }

    return { isError: true, content: [{ type: "text", text: "Unknown tool" }] };
  });

  return server;
}
