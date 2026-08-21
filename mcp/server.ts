import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_BASE = process.env.KIKIBOARD_API_URL || "http://localhost:3000";

const server = new Server(
  {
    name: "kikiboard-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Define tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_boards",
        description: "List all boards with their IDs, lists, and task counts.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "list_tasks",
        description:
          "List tasks with optional filters by boardId, status (pending/completed), priority, quarter, or archived.",
        inputSchema: {
          type: "object",
          properties: {
            boardId: { type: "string", description: "ID of the board" },
            status: {
              type: "string",
              enum: ["all", "pending", "completed"],
              description: "Filter by completion status",
            },
            priority: {
              type: "string",
              enum: ["urgent", "high", "medium", "low"],
              description: "Filter by priority",
            },
            quarter: {
              type: "string",
              description: "Filter by quarter e.g. 2026-Q1",
            },
            archived: {
              type: "boolean",
              description: "Include archived tasks",
            },
          },
        },
      },
      {
        name: "create_task",
        description: "Create a new task in a specific list.",
        inputSchema: {
          type: "object",
          required: ["listId", "title"],
          properties: {
            listId: { type: "string", description: "ID of the list" },
            title: { type: "string", description: "Task title" },
            description: { type: "string", description: "HTML or plain text description" },
            priority: {
              type: "string",
              enum: ["urgent", "high", "medium", "low"],
              description: "Priority",
            },
            dueDate: { type: "string", description: "ISO date (YYYY-MM-DD)" },
            quarter: { type: "string", description: "Quarter tag e.g. 2026-Q1" },
            epicId: { type: "string", description: "ID of Epic" },
          },
        },
      },
      {
        name: "update_task",
        description: "Update an existing task's fields or mark complete/reopened.",
        inputSchema: {
          type: "object",
          required: ["taskId"],
          properties: {
            taskId: { type: "string", description: "ID of the task" },
            title: { type: "string" },
            description: { type: "string" },
            completed: { type: "boolean" },
            priority: { type: "string", enum: ["urgent", "high", "medium", "low"] },
            dueDate: { type: "string" },
            quarter: { type: "string" },
            archived: { type: "boolean" },
          },
        },
      },
      {
        name: "parse_and_create_tasks",
        description:
          "Parse natural language narrative text (meeting notes, brain dump) with AI and create structured tasks on a board.",
        inputSchema: {
          type: "object",
          required: ["boardId", "text"],
          properties: {
            boardId: { type: "string", description: "Target board ID" },
            text: { type: "string", description: "Unformatted notes or transcript" },
          },
        },
      },
      {
        name: "bulk_archive_tasks",
        description: "Bulk archive completed tasks or tasks by quarter.",
        inputSchema: {
          type: "object",
          required: ["boardId"],
          properties: {
            boardId: { type: "string", description: "Board ID" },
            taskIds: { type: "array", items: { type: "string" } },
            completedOnly: { type: "boolean" },
            quarter: { type: "string" },
          },
        },
      },
      {
        name: "list_epics",
        description: "List all epics for a board with progress statistics.",
        inputSchema: {
          type: "object",
          required: ["boardId"],
          properties: {
            boardId: { type: "string", description: "Board ID" },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list_boards": {
        const res = await fetch(`${API_BASE}/api/boards/getBoards`);
        const data = await res.json();
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "list_tasks": {
        const queryParams = new URLSearchParams();
        if (args?.status) queryParams.set("status", String(args.status));
        if (args?.priority) queryParams.set("priority", String(args.priority));
        if (args?.quarter) queryParams.set("quarter", String(args.quarter));

        const res = await fetch(`${API_BASE}/api/tasks?${queryParams.toString()}`);
        const data = await res.json();
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "create_task": {
        const res = await fetch(`${API_BASE}/api/tasks/createTask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(args),
        });
        const data = await res.json();
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "update_task": {
        const { taskId, ...updateFields } = args as any;
        const res = await fetch(`${API_BASE}/api/tasks/updateTask/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateFields),
        });
        const data = await res.json();
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "parse_and_create_tasks": {
        const { boardId, text } = args as any;
        const parseRes = await fetch(`${API_BASE}/api/ai/parse`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const parseData = await parseRes.json();

        if (!parseRes.ok || !parseData.tasks) {
          throw new Error(parseData.error || "Failed to parse text with AI");
        }

        const batchRes = await fetch(`${API_BASE}/api/boards/${boardId}/batchTasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tasks: parseData.tasks }),
        });
        const batchData = await batchRes.json();

        return {
          content: [{ type: "text", text: JSON.stringify(batchData, null, 2) }],
        };
      }

      case "bulk_archive_tasks": {
        const { boardId, ...archiveBody } = args as any;
        const res = await fetch(`${API_BASE}/api/boards/${boardId}/archive`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(archiveBody),
        });
        const data = await res.json();
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "list_epics": {
        const { boardId } = args as any;
        const res = await fetch(`${API_BASE}/api/boards/${boardId}/epics`);
        const data = await res.json();
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      default:
        throw new Error(`Herramienta desconocida: ${name}`);
    }
  } catch (err: any) {
    return {
      isError: true,
      content: [{ type: "text", text: `Error: ${err.message}` }],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Kikiboard MCP Server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error in MCP server:", err);
  process.exit(1);
});
