import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import db from "@/lib/db";
import type { ExternalAccessContext } from "@/lib/externalAccess";
import { createMcpTicket, updateMcpTickets, listMcpChanges, revertMcpChange, McpWriteError } from "./writes";

import { relationSchema } from "./ticketRelations";
import { informationResponse, presentationSchema, SVG_CAPABILITY } from "./presentation";
import { canReadBoard } from "@/lib/boardAccess";

const userSelect = { id: true, name: true, email: true } as const;
async function boardPeople(board: { id: string }, organizationId: string) {
  const candidates = await db.user.findMany({
    where: { OR: [
      { boards: { some: { id: board.id } } },
      { boardMembers: { some: { boardId: board.id } } },
      { organizationMembers: { some: { organizationId } } },
    ] }, select: userSelect, orderBy: [{ name: "asc" }, { id: "asc" }],
  });
  const people = [];
  for (const user of candidates) if (await canReadBoard(user.id, board.id)) people.push(user);
  return people;
}
const boardMetadata = {
  accessMode: true, defaultRole: true,
  user: { select: userSelect },
  labels: { select: { id: true, title: true, color: true } },
  epics: { select: { id: true, title: true, status: true, quarter: true } },
  customFields: { orderBy: { order: "asc" }, select: { id: true, name: true, defaultKey: true, type: true, options: true, enabled: true } },
} as const;
const PRIORITIES = new Set(["urgent", "high", "medium", "low"]);
const taskChangesSchema = { type: "object", additionalProperties: false, properties: {
  title: { type: "string", maxLength: 500 }, description: { type: ["string", "null"], maxLength: 50000 },
  priority: { type: ["string", "null"], enum: ["urgent", "high", "medium", "low", null] },
  listId: { type: "string" }, completed: { type: "boolean" }, archived: { type: "boolean" },
  startDate: { type: ["string", "null"] }, dueDate: { type: ["string", "null"] },
  assigneeId: { type: ["string", "null"] }, qaId: { type: ["string", "null"] }, epicId: { type: ["string", "null"] },
  quarter: { type: ["string", "null"], pattern: "^\\d{4}-Q[1-4]$" }, order: { type: "integer", minimum: 0 },
  ...relationSchema,
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
    customField: { id?: string; name: string; defaultKey: string | null; type: string; options?: unknown; enabled?: boolean };
  }[];
}) {
  const { labels, customValues, ...ticket } = task;
  return {
    ...ticket,
    labels: labels.map((row) => row.label),
    customFields: customValues.map((row) => ({
      ...(row.customField.id ? { id: row.customField.id, options: row.customField.options, enabled: row.customField.enabled } : {}),
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
    { name: "kikiboard", version: "1.2.0" },
    { capabilities: { tools: {}, experimental: { [SVG_CAPABILITY]: { supported: true, links: true } } } },
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
        description: `List tickets on ${scopeDescription}. By default, returns a ready-to-display Markdown table grouped by board, with colored status and priority emoji, assignees, QA, due dates and ticket links. Present the returned table to the user, preserving its columns, links and emoji rather than replacing it with a plain list. Full original records are also available in structuredContent.data. Raw JSON text and SVG are explicit presentation options.`,
        inputSchema: {
          type: "object",
          additionalProperties: false,
          properties: {
            status: { type: "string", enum: ["all", "pending", "completed"] },
            priority: { type: "string", enum: ["urgent", "high", "medium", "low"] },
            assigneeId: { type: "string" }, qaId: { type: "string" },
            person: { type: "string", description: "Case-insensitive assignee name or email search" },
            cursor: { type: "string", description: "Last ticket ID from the previous page" },
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
        description: `Get all ticket details, people, checklist, comments, attachment metadata and custom field definitions/values when the ticket belongs to ${scopeDescription}.`,
        inputSchema: {
          type: "object",
          additionalProperties: false,
          required: ["ticketId"],
          properties: { ticketId: { type: "string" } },
        },
      },
      {
        name: "get_attachment", description: "Read an attachment belonging to a ticket in this connection as base64 (maximum 5 MiB).",
        annotations: { readOnlyHint: true, openWorldHint: false },
        securitySchemes: [{ type: "oauth2", scopes: ["tickets:read"] }],
        _meta: { securitySchemes: [{ type: "oauth2", scopes: ["tickets:read"] }] },
        inputSchema: { type: "object", additionalProperties: false, required: ["ticketId", "attachmentId"], properties: { ticketId: { type: "string" }, attachmentId: { type: "string" } } },
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
          inputSchema: { type: "object", additionalProperties: false, required: ["title", "listId"], properties: { ...taskChangesSchema.properties, summary: { type: "string", maxLength: 500 } } } },
        { name: "update_tickets", description: "Edit, move, complete or archive up to 50 tickets on one board atomically. Every batch has a change ID and before/after history. Supports people, QA, collaborators, labels, epics, custom fields, checklist, comments, attachments and public sharing. IDs and custom-field options are available from get_project. Server-generated IDs, timestamps and calendar integration IDs cannot be supplied.", ...writeMetadata, annotations: { ...writeMetadata.annotations, destructiveHint: true },
          inputSchema: { type: "object", additionalProperties: false, required: ["updates"], properties: { updates: { type: "array", minItems: 1, maxItems: 50, items: { type: "object", required: ["ticketId", "changes"], additionalProperties: false, properties: { ticketId: { type: "string" }, changes: taskChangesSchema } } }, summary: { type: "string", maxLength: 500 } } } },
        { name: "revert_change", description: "Preview undo with confirm=false first. After user approval, set confirm=true to revert an entire MCP change. Conflicts with later task edits reject the whole revert. Creation is undone by archiving.", ...writeMetadata,
          inputSchema: { type: "object", additionalProperties: false, required: ["changeId"], properties: { changeId: { type: "string" }, confirm: { type: "boolean", default: false } } } },
      ] : []),
    ].map(tool => ["get_project", "list_tickets", "get_ticket", "get_change_history"].includes(tool.name) ? { ...tool, inputSchema: { ...tool.inputSchema, properties: { ...tool.inputSchema.properties, presentation: presentationSchema } } } : tool),
  }));

  server.setRequestHandler(CallToolRequestSchema, async ({ params }) => {
    const args = (params.arguments ?? {}) as Record<string, unknown>;
    const metadata = params._meta as Record<string, unknown> | undefined;
    const capabilities = metadata?.["io.modelcontextprotocol/clientCapabilities"] ?? server.getClientCapabilities();
    const information = (data: unknown) => informationResponse(params.name, data, args.presentation, capabilities);
    if (["create_ticket", "update_tickets", "get_change_history", "revert_change"].includes(params.name)) {
      try {
        if (params.name === "get_change_history") return information(await listMcpChanges(context));
        if (!context.scopes.includes("tickets:write")) throw new McpWriteError("This connection is read-only");
        if (params.name === "create_ticket") return text(await createMcpTicket(context, args));
        if (params.name === "update_tickets") return text(await updateMcpTickets(context, args));
        if (typeof args.changeId !== "string" || !args.changeId) throw new McpWriteError("changeId is required");
        return text(await revertMcpChange(context, args.changeId, args.confirm === true));
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: error instanceof McpWriteError ? error.message : "The operation could not be completed. Refresh ticket data before retrying." }] };
      }
    }

    if (params.name === "get_attachment") {
      if (typeof args.ticketId !== "string" || typeof args.attachmentId !== "string") return { isError: true, content: [{ type: "text", text: "ticketId and attachmentId are required" }] };
      const attachment = await db.attachment.findFirst({ where: { id: args.attachmentId, taskId: args.ticketId, task: ticketScope(context) }, select: { filename: true, size: true, url: true } });
      if (!attachment || attachment.size > 5 * 1024 * 1024) return { isError: true, content: [{ type: "text", text: "Attachment not found or larger than 5 MiB" }] };
      try {
        const response = await fetch(attachment.url, { headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }, signal: AbortSignal.timeout(15000) });
        if (!response.ok || !response.body) throw new Error("Unavailable");
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = []; let size = 0;
        try {
          while (true) {
            const chunk = await reader.read(); if (chunk.done) break;
            size += chunk.value.byteLength;
            if (size > 5 * 1024 * 1024) throw new Error("Too large");
            chunks.push(chunk.value);
          }
        } finally { await reader.cancel(); }
        return text({ filename: attachment.filename, size, contentType: response.headers.get("content-type"), contentBase64: Buffer.concat(chunks).toString("base64") });
      } catch { return { isError: true, content: [{ type: "text", text: "Attachment could not be read" }] }; }
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
            ...boardMetadata,
            list: { orderBy: { order: "asc" }, select: { id: true, title: true } },
          },
        });
        if (!board || board.organizationId !== context.organizationId) {
          return { isError: true, content: [{ type: "text", text: "Board not found" }] };
        }
        return information({ scope: "board", board: { ...board, people: await boardPeople(board, context.organizationId) } });
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
              ...boardMetadata,
              list: { orderBy: { order: "asc" }, select: { id: true, title: true } },
            },
          },
        },
      });
      if (!organization) {
        return { isError: true, content: [{ type: "text", text: "Organization not found" }] };
      }
      const boards = await Promise.all(organization.boards.map(async board => ({ ...board, people: await boardPeople(board, context.organizationId) })));
      return information({ scope: "organization", organization: { ...organization, boards } });
    }

    if (params.name === "list_tickets") {
      const status = args.status === "pending" || args.status === "completed" ? args.status : "all";
      const limit = typeof args.limit === "number" && Number.isFinite(args.limit) ? Math.max(1, Math.min(100, Math.trunc(args.limit))) : 50;
      const priority = typeof args.priority === "string" && PRIORITIES.has(args.priority)
        ? args.priority
        : undefined;
      const tasks = await db.task.findMany({
        where: {
          ...ticketScope(context),
          archived: args.archived === true,
          ...(typeof args.assigneeId === "string" ? { assigneeId: args.assigneeId } : {}),
          ...(typeof args.qaId === "string" ? { qaId: args.qaId } : {}),
          ...(typeof args.person === "string" && args.person.trim() ? { assignee: { OR: [{ name: { contains: args.person.trim(), mode: "insensitive" as const } }, { email: { contains: args.person.trim(), mode: "insensitive" as const } }] } } : {}),
          ...(status === "pending" ? { completed: false } : {}),
          ...(status === "completed" ? { completed: true } : {}),
          ...(priority ? { priority } : {}),
          ...(typeof args.query === "string" && args.query.trim()
            ? { title: { contains: args.query.trim(), mode: "insensitive" as const } }
            : {}),
        },
        orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
        take: limit,
        ...(typeof args.cursor === "string" ? { cursor: { id: args.cursor }, skip: 1 } : {}),
        select: {
          id: true,
          title: true,
          completed: true,
          priority: true,
          startDate: true,
          dueDate: true,
          quarter: true,
          assigneeId: true, qaId: true, assignee: { select: userSelect }, qa: { select: userSelect },
          updatedAt: true,
          list: { select: listSelect },
        },
      });
      return information(tasks.map(({ list, ...task }) => ({
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
          listId: true, epicId: true, completedById: true,
          order: true, completedAt: true, completedBy: { select: userSelect }, archivedAt: true,
          shareToken: true, googleEventId: true,
          collaborators: { select: { user: { select: userSelect } } },
          subtasks: { orderBy: { order: "asc" }, select: { id: true, title: true, completed: true, order: true, createdAt: true } },
          comments: { orderBy: { createdAt: "asc" }, select: { id: true, content: true, createdAt: true, updatedAt: true, user: { select: userSelect } } },
          attachments: { select: { id: true, filename: true, size: true, createdAt: true } },
          quarter: true,
          assigneeId: true, qaId: true, assignee: { select: userSelect }, qa: { select: userSelect },
          createdAt: true,
          updatedAt: true,
          list: { select: listSelect },
          epic: { select: { id: true, title: true } },
          labels: { select: { label: { select: { id: true, title: true, color: true } } } },
          customValues: {
            select: {
              value: true,
              customField: { select: { id: true, name: true, defaultKey: true, type: true, options: true, enabled: true } },
            },
          },
        },
      });
      if (!task) {
        return { isError: true, content: [{ type: "text", text: "Ticket not found" }] };
      }
      const definitions = await db.customField.findMany({ where: { boardId: task.list.board.id }, orderBy: { order: "asc" }, select: { id: true, name: true, defaultKey: true, type: true, options: true, enabled: true } });
      const { list, ...ticket } = task;
      const detail = toTicketDetail(ticket);
      return information({
        ...detail,
        customFields: definitions.length ? definitions.map(field => ({ id: field.id, name: field.name, key: field.defaultKey, type: field.type, options: field.options, enabled: field.enabled, value: task.customValues.find(row => row.customField.id === field.id)?.value ?? null })) : detail.customFields,
        collaborators: ticket.collaborators?.map(row => row.user) ?? [],
        board: list.board,
        list: { id: list.id, title: list.title },
      });
    }

    return { isError: true, content: [{ type: "text", text: "Unknown tool" }] };
  });

  return server;
}
