import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import db from "@/lib/db";
import type { ExternalAccessContext } from "@/lib/externalAccess";
import { createMcpTicket, createMcpEpic, updateMcpTickets, listMcpChanges, revertMcpChange, McpWriteError, boardScope } from "./writes";

import { relationSchema } from "./ticketRelations";
import { informationResponse, presentationSchema, SVG_CAPABILITY } from "./presentation";
import { MCP_SERVER_INSTRUCTIONS, ticketDevelopment } from "./ticketDevelopment";
import { canReadBoard, getBoardRole } from "@/lib/boardAccess";
import {
  getBoardMetricsSummary,
  getStateTransitionHistory,
  type AllocationPolicy,
  type GroupByInterval,
  type MetricsDbClient,
} from "@/lib/metrics/storyPoints";
import {
  canEditBoard as roleCanEditBoard,
  canManageBoard as roleCanManageBoard,
} from "@/lib/boardRoles";

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
  accessMode: true, defaultRole: true, memberCanAssign: true,
  user: { select: userSelect },
  labels: { select: { id: true, title: true, color: true } },
  epics: { select: { id: true, title: true, status: true, quarter: true } },
  customFields: { orderBy: { order: "asc" }, select: { id: true, name: true, defaultKey: true, type: true, options: true, enabled: true } },
} as const;

async function personalBoardCapabilities(
  board: { id: string; memberCanAssign: boolean },
  createdById: string,
) {
  const role = await getBoardRole(createdById, board.id);
  const canEdit = roleCanEditBoard(role);
  const canManage = roleCanManageBoard(role);
  return {
    role,
    canEdit,
    // Match app assignment routes: need edit rights, then admin or memberCanAssign.
    canAssign: canEdit && (canManage || board.memberCanAssign),
    canManage,
  };
}
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

function ticketScope(context: ExternalAccessContext, boardId?: string) {
  if (context.boardId) {
    if (boardId && boardId !== context.boardId) return null;
    return { list: { boardId: context.boardId } };
  }
  if (boardId) return { list: { boardId, board: boardScope(context) } };
  return { list: { board: boardScope(context) } };
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
  board: {
    select: {
      id: true,
      title: true,
      key: true,
      organization: { select: { githubConnection: { select: { branch: true } } } },
    },
  },
} as const;

export function createScopedMcpServer(context: ExternalAccessContext) {
  const server = new Server(
    { name: "kikiboard", version: "1.2.0" },
    {
      capabilities: { tools: {}, experimental: { [SVG_CAPABILITY]: { supported: true, links: true } } },
      instructions: MCP_SERVER_INSTRUCTIONS,
    },
  );
  const scopeDescription = context.boardId
    ? "the single board bound to this connection"
    : context.fullAccess
      ? "every board the connection creator can currently open in Kikiboard, with the same rights as in the app"
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
        description: `List tickets on ${scopeDescription}. Returns the newest tickets first (createdAt descending). By default, returns a ready-to-display Markdown table grouped by board, with colored status and priority emoji, assignees, QA, created/due dates and ticket links. Each row includes createdAt so agents can track creation time when batching updates. Present the returned table to the user, preserving its columns, links and emoji rather than replacing it with a plain list. Full original records are also available in structuredContent.data. Raw JSON text and SVG are explicit presentation options.`,
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
            boardId: { type: "string", description: "Optional board filter from get_project. Recommended for personal connections." },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 50 },
          },
        },
      },
      {
        name: "get_ticket",
        securitySchemes: [{ type: "oauth2", scopes: ["tickets:read"] }],
        annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
        _meta: { securitySchemes: [{ type: "oauth2", scopes: ["tickets:read"] }] },
        description: `Get all ticket details, people, checklist, comments, attachment metadata, custom field definitions/values, and development (ticketKey, suggestedBranch, checkout command) when the ticket belongs to ${scopeDescription}. When implementing the ticket, use development.suggestedBranch as the git branch and PR head; PR title defaults to the ticket title.`,
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
        name: "get_change_history", description: "List the latest 50 MCP task operations in this connection, including change IDs and revert status. On a personal connection, only boards you own or admin are included (same as Settings history).",
        securitySchemes: [{ type: "oauth2", scopes: ["tickets:read"] }],
        _meta: { securitySchemes: [{ type: "oauth2", scopes: ["tickets:read"] }] },
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true },
      },
      {
        name: "get_board_metrics",
        description: `Calculate delivery velocity, achieved story points per user, burndown, lead/cycle times, and column bottleneck metrics for a board in ${scopeDescription}. Uses immutable TaskStateTransition snapshots (ISO 27001 A.8.15/A.8.32).`,
        securitySchemes: [{ type: "oauth2", scopes: ["tickets:read"] }],
        _meta: { securitySchemes: [{ type: "oauth2", scopes: ["tickets:read"] }] },
        annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
        inputSchema: {
          type: "object",
          additionalProperties: false,
          properties: {
            boardId: { type: "string", description: "Board ID from get_project (optional on board-scoped connections)." },
            startDate: { type: "string", description: "Optional ISO-8601 start date filter." },
            endDate: { type: "string", description: "Optional ISO-8601 end date filter." },
            groupBy: { type: "string", enum: ["day", "week", "month"], default: "week" },
            userId: { type: "string", description: "Optional user ID to filter achieved story points." },
            allocationPolicy: { type: "string", enum: ["primary", "split"], default: "primary" },
          },
        },
      },
      {
        name: "get_state_history",
        description: `Retrieve the chronological, append-only state transition timeline (timestamps, dwell duration per column, assignee and story points snapshots at move) for a ticket or board in ${scopeDescription}.`,
        securitySchemes: [{ type: "oauth2", scopes: ["tickets:read"] }],
        _meta: { securitySchemes: [{ type: "oauth2", scopes: ["tickets:read"] }] },
        annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
        inputSchema: {
          type: "object",
          additionalProperties: false,
          properties: {
            boardId: { type: "string", description: "Board ID from get_project (optional on board-scoped connections or when ticketId is provided)." },
            ticketId: { type: "string", description: "Optional ticket ID to inspect transitions for a single ticket." },
            startDate: { type: "string", description: "Optional ISO-8601 start date filter." },
            endDate: { type: "string", description: "Optional ISO-8601 end date filter." },
            limit: { type: "integer", minimum: 1, maximum: 500, default: 100 },
          },
        },
      },
      ...(context.scopes.includes("tickets:write") ? [
        { name: "create_ticket", description: "Create a ticket in a list in this connection. Returns a change ID; reverting creation archives the ticket and preserves its content.", ...writeMetadata,
          inputSchema: { type: "object", additionalProperties: false, required: ["title", "listId"], properties: { ...taskChangesSchema.properties, summary: { type: "string", maxLength: 500 } } } },
        { name: "create_epic", description: "Create an epic on a board in this connection. A board-scoped token uses that board; organization and personal tokens must pass boardId from get_project. Returns the epic so tickets can be attached with update_tickets. Epic creation is not in change history and cannot be reverted. Requires edit rights on that board (member or above).", ...writeMetadata,
          inputSchema: { type: "object", additionalProperties: false, required: ["title"], properties: { title: { type: "string", maxLength: 500 }, description: { type: ["string", "null"], maxLength: 50000 }, color: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" }, quarter: { type: ["string", "null"], pattern: "^\\d{4}-Q[1-4]$" }, boardId: { type: "string", description: "Required for organization and personal connections. On a board-scoped token it must match the bound board if supplied." } } } },
        { name: "update_tickets", description: "Edit, move, complete or archive up to 50 tickets on one board atomically. Every batch has a change ID and before/after history. Supports people, QA, collaborators, labels, epics, custom fields, checklist, comments, attachments and public sharing. IDs and custom-field options are available from get_project. Server-generated IDs, timestamps and calendar integration IDs cannot be supplied.", ...writeMetadata, annotations: { ...writeMetadata.annotations, destructiveHint: true },
          inputSchema: { type: "object", additionalProperties: false, required: ["updates"], properties: { updates: { type: "array", minItems: 1, maxItems: 50, items: { type: "object", required: ["ticketId", "changes"], additionalProperties: false, properties: { ticketId: { type: "string" }, changes: taskChangesSchema } } }, summary: { type: "string", maxLength: 500 } } } },
        { name: "revert_change", description: "Preview undo with confirm=false first. After user approval, set confirm=true to revert an entire MCP change. Conflicts with later task edits reject the whole revert. Creation is undone by archiving. On a personal connection, only a board owner or admin can revert.", ...writeMetadata,
          inputSchema: { type: "object", additionalProperties: false, required: ["changeId"], properties: { changeId: { type: "string" }, confirm: { type: "boolean", default: false } } } },
      ] : []),
    ].map(tool => ["get_project", "list_tickets", "get_ticket", "get_change_history"].includes(tool.name) ? { ...tool, inputSchema: { ...tool.inputSchema, properties: { ...tool.inputSchema.properties, presentation: presentationSchema } } } : tool),
  }));

  server.setRequestHandler(CallToolRequestSchema, async ({ params }) => {
    const args = (params.arguments ?? {}) as Record<string, unknown>;
    const metadata = params._meta as Record<string, unknown> | undefined;
    const capabilities = metadata?.["io.modelcontextprotocol/clientCapabilities"] ?? server.getClientCapabilities();
    const information = (data: unknown) => informationResponse(params.name, data, args.presentation, capabilities);
    if (["create_ticket", "create_epic", "update_tickets", "get_change_history", "revert_change"].includes(params.name)) {
      try {
        if (params.name === "get_change_history") return information(await listMcpChanges(context));
        if (!context.scopes.includes("tickets:write")) throw new McpWriteError("This connection is read-only");
        if (params.name === "create_ticket") return text(await createMcpTicket(context, args));
        if (params.name === "create_epic") return text(await createMcpEpic(context, args));
        if (params.name === "update_tickets") return text(await updateMcpTickets(context, args));
        if (typeof args.changeId !== "string" || !args.changeId) throw new McpWriteError("changeId is required");
        return text(await revertMcpChange(context, args.changeId, args.confirm === true));
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: error instanceof McpWriteError ? error.message : "The operation could not be completed. Refresh ticket data before retrying." }] };
      }
    }

    if (params.name === "get_attachment") {
      if (typeof args.ticketId !== "string" || typeof args.attachmentId !== "string") return { isError: true, content: [{ type: "text", text: "ticketId and attachmentId are required" }] };
      let taskFilter;
      try { taskFilter = ticketScope(context); } catch (error) {
        return { isError: true, content: [{ type: "text", text: error instanceof McpWriteError ? error.message : "Attachment not found" }] };
      }
      if (!taskFilter) return { isError: true, content: [{ type: "text", text: "Attachment not found or larger than 5 MiB" }] };
      const attachment = await db.attachment.findFirst({ where: { id: args.attachmentId, taskId: args.ticketId, task: taskFilter }, select: { filename: true, size: true, url: true } });
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
        if (!context.organizationId) {
          return { isError: true, content: [{ type: "text", text: "Board not found" }] };
        }
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

      if (context.fullAccess) {
        try {
          if (!context.createdById) {
            return { isError: true, content: [{ type: "text", text: "Personal connection is missing its creator" }] };
          }
          const createdById = context.createdById;
          const boards = await db.board.findMany({
            where: boardScope(context),
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              title: true,
              description: true,
              organizationId: true,
              organization: { select: { id: true, name: true } },
              ...boardMetadata,
              list: { orderBy: { order: "asc" }, select: { id: true, title: true } },
            },
          });
          const detailed = await Promise.all(boards.map(async (board) => ({
            ...board,
            ...(await personalBoardCapabilities(board, createdById)),
            people: await boardPeople(board, board.organizationId),
          })));
          return information({ scope: "personal", boards: detailed });
        } catch (error) {
          return { isError: true, content: [{ type: "text", text: error instanceof McpWriteError ? error.message : "Project not found" }] };
        }
      }

      if (!context.organizationId) {
        return { isError: true, content: [{ type: "text", text: "Organization not found" }] };
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
      const boards = await Promise.all(organization.boards.map(async (board) => ({ ...board, people: await boardPeople(board, context.organizationId!) })));
      return information({ scope: "organization", organization: { ...organization, boards } });
    }

    if (params.name === "list_tickets") {
      const status = args.status === "pending" || args.status === "completed" ? args.status : "all";
      const limit = typeof args.limit === "number" && Number.isFinite(args.limit) ? Math.max(1, Math.min(100, Math.trunc(args.limit))) : 50;
      const priority = typeof args.priority === "string" && PRIORITIES.has(args.priority)
        ? args.priority
        : undefined;
      const boardId = typeof args.boardId === "string" && args.boardId.trim() ? args.boardId.trim() : undefined;
      let scope;
      try {
        scope = ticketScope(context, boardId);
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: error instanceof McpWriteError ? error.message : "Tickets not found" }] };
      }
      if (!scope) return { isError: true, content: [{ type: "text", text: "Board not found in this connection" }] };
      let cursorFilter: { OR: object[] } | undefined;
      if (typeof args.cursor === "string" && args.cursor) {
        const cursorTask = await db.task.findFirst({
          where: { id: args.cursor, ...scope },
          select: { id: true, createdAt: true },
        });
        if (!cursorTask) return { isError: true, content: [{ type: "text", text: "Cursor not found" }] };
        cursorFilter = { OR: [
          { createdAt: { lt: cursorTask.createdAt } },
          { createdAt: cursorTask.createdAt, id: { gt: cursorTask.id } },
        ] };
      }
      const tasks = await db.task.findMany({
        where: {
          ...scope,
          ...(cursorFilter ?? {}),
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
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        take: limit,
        select: {
          id: true,
          title: true,
          number: true,
          completed: true,
          priority: true,
          startDate: true,
          dueDate: true,
          quarter: true,
          assigneeId: true, qaId: true, assignee: { select: userSelect }, qa: { select: userSelect },
          createdAt: true,
          updatedAt: true,
          list: { select: listSelect },
        },
      });
      return information(tasks.map(({ list, ...task }) => ({
        ...task,
        development: ticketDevelopment({ title: task.title, number: task.number, list }),
        board: { id: list.board.id, title: list.board.title },
        list: { id: list.id, title: list.title },
      })));
    }

    if (params.name === "get_ticket") {
      if (typeof args.ticketId !== "string" || !args.ticketId) {
        return { isError: true, content: [{ type: "text", text: "ticketId is required" }] };
      }
      let scope;
      try { scope = ticketScope(context); } catch (error) {
        return { isError: true, content: [{ type: "text", text: error instanceof McpWriteError ? error.message : "Ticket not found" }] };
      }
      if (!scope) return { isError: true, content: [{ type: "text", text: "Ticket not found" }] };
      const task = await db.task.findFirst({
        where: {
          id: args.ticketId,
          ...scope,
        },
        select: {
          id: true,
          title: true,
          number: true,
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
        development: ticketDevelopment({ title: task.title, number: task.number, list }),
        customFields: definitions.length ? definitions.map(field => ({ id: field.id, name: field.name, key: field.defaultKey, type: field.type, options: field.options, enabled: field.enabled, value: task.customValues.find(row => row.customField.id === field.id)?.value ?? null })) : detail.customFields,
        collaborators: ticket.collaborators?.map(row => row.user) ?? [],
        board: { id: list.board.id, title: list.board.title },
        list: { id: list.id, title: list.title },
      });
    }

    if (params.name === "get_board_metrics") {
      const requestedBoardId =
        typeof args.boardId === "string" && args.boardId.trim()
          ? args.boardId.trim()
          : context.boardId ?? undefined;
      if (!requestedBoardId) {
        return { isError: true, content: [{ type: "text", text: "boardId is required for organization and personal connections" }] };
      }
      if (context.boardId && requestedBoardId !== context.boardId) {
        return { isError: true, content: [{ type: "text", text: "Board not found in this connection" }] };
      }
      let boardFilter;
      try {
        boardFilter = context.boardId
          ? { id: context.boardId, ...(context.organizationId ? { organizationId: context.organizationId } : {}) }
          : { id: requestedBoardId, ...boardScope(context) };
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: error instanceof McpWriteError ? error.message : "Board not found" }] };
      }
      const board = await db.board.findFirst({
        where: boardFilter,
        select: { id: true },
      });
      if (!board) {
        return { isError: true, content: [{ type: "text", text: "Board not found in this connection" }] };
      }

      const groupBy: GroupByInterval =
        args.groupBy === "day" || args.groupBy === "month" ? args.groupBy : "week";
      const allocationPolicy: AllocationPolicy =
        args.allocationPolicy === "split" ? "split" : "primary";
      const startDate = typeof args.startDate === "string" ? args.startDate : null;
      const endDate = typeof args.endDate === "string" ? args.endDate : null;
      const userId = typeof args.userId === "string" ? args.userId : undefined;

      const summary = await getBoardMetricsSummary(
        db as unknown as MetricsDbClient,
        board.id,
        { startDate, endDate, groupBy, userId, allocationPolicy },
      );
      return text(summary);
    }

    if (params.name === "get_state_history") {
      const ticketId =
        typeof args.ticketId === "string" && args.ticketId.trim() ? args.ticketId.trim() : null;
      let resolvedBoardId =
        typeof args.boardId === "string" && args.boardId.trim()
          ? args.boardId.trim()
          : context.boardId ?? null;

      if (ticketId) {
        let scope;
        try {
          scope = ticketScope(context, resolvedBoardId ?? undefined);
        } catch (error) {
          return { isError: true, content: [{ type: "text", text: error instanceof McpWriteError ? error.message : "Ticket not found" }] };
        }
        if (!scope) {
          return { isError: true, content: [{ type: "text", text: "Ticket not found in this connection" }] };
        }
        const task = await db.task.findFirst({
          where: { id: ticketId, ...scope },
          select: { id: true, list: { select: { boardId: true } } },
        });
        if (!task) {
          return { isError: true, content: [{ type: "text", text: "Ticket not found in this connection" }] };
        }
        resolvedBoardId = task.list.boardId;
      } else {
        if (!resolvedBoardId) {
          return { isError: true, content: [{ type: "text", text: "boardId or ticketId is required" }] };
        }
        if (context.boardId && resolvedBoardId !== context.boardId) {
          return { isError: true, content: [{ type: "text", text: "Board not found in this connection" }] };
        }
        let boardFilter;
        try {
          boardFilter = context.boardId
            ? { id: context.boardId, ...(context.organizationId ? { organizationId: context.organizationId } : {}) }
            : { id: resolvedBoardId, ...boardScope(context) };
        } catch (error) {
          return { isError: true, content: [{ type: "text", text: error instanceof McpWriteError ? error.message : "Board not found" }] };
        }
        const board = await db.board.findFirst({
          where: boardFilter,
          select: { id: true },
        });
        if (!board) {
          return { isError: true, content: [{ type: "text", text: "Board not found in this connection" }] };
        }
      }

      const limit =
        typeof args.limit === "number" && Number.isFinite(args.limit)
          ? Math.max(1, Math.min(500, Math.trunc(args.limit)))
          : 100;
      const startDate = typeof args.startDate === "string" ? args.startDate : null;
      const endDate = typeof args.endDate === "string" ? args.endDate : null;

      const transitions = await getStateTransitionHistory(
        db as unknown as MetricsDbClient,
        {
          boardId: resolvedBoardId,
          taskId: ticketId,
          startDate,
          endDate,
          limit,
        },
      );
      return text({ boardId: resolvedBoardId, ticketId, transitions });
    }

    return { isError: true, content: [{ type: "text", text: "Unknown tool" }] };
  });

  return server;
}
