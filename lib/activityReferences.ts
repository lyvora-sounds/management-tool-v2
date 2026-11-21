import db from "@/lib/db";
import { decodeLogMessage, type ActivityTicketRef, type DecodedLog } from "@/lib/activityMessages";
import { formatTicketKey } from "@/lib/integrations/ticketBranch";

export type ActivityReference = {
  taskId: string;
  ticketKey: string | null;
  title: string;
  url: string;
};

export type ActivityLogInput = {
  id: string;
  boardId: string;
  type: string;
  message: string;
  userId: string;
  createdAt: Date;
};

type TaskSummary = {
  id: string;
  boardId: string;
  title: string;
  number: number;
};

type McpChangeSummary = {
  id: string;
  boardId: string;
  actorId: string;
  createdAt: Date;
  after: unknown;
};

type ActivityReferenceStore = {
  board: {
    findMany: (args: {
      where: { id: { in: string[] } };
      select: { id: true; key: true };
    }) => Promise<Array<{ id: string; key: string }>>;
  };
  task: {
    findMany: (args: {
      where: { list: { boardId: { in: string[] } } };
      select: { id: true; title: true; number: true; list: { select: { boardId: true } } };
    }) => Promise<Array<{ id: string; title: string; number: number; list: { boardId: string } }>>;
  };
  mcpChange: {
    findMany: (args: {
      where: { boardId: { in: string[] } };
      orderBy: { createdAt: "desc" };
      take: number;
      select: { id: true; boardId: true; actorId: true; createdAt: true; after: true };
    }) => Promise<McpChangeSummary[]>;
  };
};

const MCP_MATCH_WINDOW_MS = 5000;

export function buildTicketUrl(appUrl: string, boardId: string, taskId: string): string {
  const path = `/board/${encodeURIComponent(boardId)}?taskId=${encodeURIComponent(taskId)}`;
  try {
    const parsed = new URL(appUrl.trim());
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return `${parsed.origin}${path}`;
    }
  } catch {
    // Fall back to a relative board deep-link when appUrl is empty or invalid.
  }
  return path;
}

function isEpicOnlyMcpLog(decoded: DecodedLog | null): boolean {
  return decoded?.key === "activity.mcpEpicCreated" || decoded?.key === "activity.mcpEpicCreatedNamed";
}

function legacyTitleForLog(type: string, decoded: DecodedLog | null): string | null {
  if (!decoded || type === "task_deleted") return null;
  if (typeof decoded.params.newTitle === "string" && decoded.params.newTitle.trim()) {
    return decoded.params.newTitle.trim();
  }
  if (typeof decoded.params.ticket === "string" && decoded.params.ticket.trim()) {
    return decoded.params.ticket.trim();
  }
  return null;
}

function extractTaskIdsFromSnapshot(after: unknown): string[] {
  if (!Array.isArray(after)) return [];
  const ids: string[] = [];
  for (const item of after) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const id = (item as { id?: unknown }).id;
    if (typeof id === "string" && id.trim()) {
      ids.push(id.trim());
    }
  }
  return ids;
}

function findClosestUnusedMcpChange(
  log: ActivityLogInput,
  changes: McpChangeSummary[],
  usedChangeIds: Set<string>,
): McpChangeSummary | null {
  const logTime = log.createdAt.getTime();
  let best: McpChangeSummary | null = null;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (const change of changes) {
    if (
      usedChangeIds.has(change.id) ||
      change.boardId !== log.boardId ||
      change.actorId !== log.userId
    ) {
      continue;
    }
    const diff = Math.abs(change.createdAt.getTime() - logTime);
    if (diff <= MCP_MATCH_WINDOW_MS && diff < bestDiff) {
      best = change;
      bestDiff = diff;
    }
  }
  if (best) usedChangeIds.add(best.id);
  return best;
}

/**
 * Fallback client resolver used only when the API/server did not return resolved `references`
 * (e.g., while `kiki-api` rollout is still pending). Relies solely on embedded `r` refs.
 */
export function fallbackActivityReferences(
  boardId: string,
  message: string,
  appUrl = "",
): ActivityReference[] {
  const decoded = decodeLogMessage(message);
  if (!decoded || decoded.refs.length === 0) return [];
  const seen = new Set<string>();
  const refs: ActivityReference[] = [];
  for (const ref of decoded.refs) {
    if (seen.has(ref.taskId)) continue;
    seen.add(ref.taskId);
    refs.push({
      taskId: ref.taskId,
      ticketKey: ref.ticketKey ?? null,
      title: ref.title ?? ref.ticketKey ?? ref.taskId,
      url: buildTicketUrl(appUrl, boardId, ref.taskId),
    });
  }
  return refs;
}

export async function resolveBoardActivityReferences(
  logs: ActivityLogInput[],
  appUrl = "",
  store: ActivityReferenceStore = db,
): Promise<Map<string, ActivityReference[]>> {
  const result = new Map<string, ActivityReference[]>();
  if (logs.length === 0) return result;

  const parsed = logs.map((log) => ({ log, decoded: decodeLogMessage(log.message) }));

  const neededBoardIds = new Set<string>();
  const mcpBoardIds = new Set<string>();

  for (const { log, decoded } of parsed) {
    if (decoded && decoded.refs.length > 0) {
      neededBoardIds.add(log.boardId);
    } else if (legacyTitleForLog(log.type, decoded)) {
      neededBoardIds.add(log.boardId);
    } else if (log.type === "mcp_change" && !isEpicOnlyMcpLog(decoded)) {
      neededBoardIds.add(log.boardId);
      mcpBoardIds.add(log.boardId);
    }
  }

  if (neededBoardIds.size === 0) return result;

  const boardIds = [...neededBoardIds];
  const [boards, rawTasks, mcpChanges] = await Promise.all([
    store.board.findMany({ where: { id: { in: boardIds } }, select: { id: true, key: true } }),
    store.task.findMany({
      where: { list: { boardId: { in: boardIds } } },
      select: { id: true, title: true, number: true, list: { select: { boardId: true } } },
    }),
    mcpBoardIds.size > 0
      ? store.mcpChange.findMany({
          where: { boardId: { in: [...mcpBoardIds] } },
          orderBy: { createdAt: "desc" },
          take: 200,
          select: { id: true, boardId: true, actorId: true, createdAt: true, after: true },
        })
      : Promise.resolve([] as McpChangeSummary[]),
  ]);

  const boardKeyById = new Map(boards.map((b) => [b.id, b.key]));
  const tasksByBoardAndId = new Map<string, TaskSummary>();
  const tasksByBoardAndTitle = new Map<string, TaskSummary[]>();

  for (const raw of rawTasks) {
    const task: TaskSummary = {
      id: raw.id,
      boardId: raw.list.boardId,
      title: raw.title,
      number: raw.number,
    };
    tasksByBoardAndId.set(`${task.boardId}:${task.id}`, task);
    const titleKey = `${task.boardId}\0${task.title}`;
    const bucket = tasksByBoardAndTitle.get(titleKey);
    if (bucket) bucket.push(task);
    else tasksByBoardAndTitle.set(titleKey, [task]);
  }

  const usedMcpChangeIds = new Set<string>();

  const toReference = (task: TaskSummary, fallbackRef?: ActivityTicketRef): ActivityReference => {
    const boardKey = boardKeyById.get(task.boardId) ?? null;
    return {
      taskId: task.id,
      ticketKey: boardKey && task.number > 0 ? formatTicketKey(boardKey, task.number) : fallbackRef?.ticketKey ?? null,
      title: task.title,
      url: buildTicketUrl(appUrl, task.boardId, task.id),
    };
  };

  for (const { log, decoded } of parsed) {
    const refs: ActivityReference[] = [];
    const seenIds = new Set<string>();
    const addTask = (task: TaskSummary | undefined, fallbackRef?: ActivityTicketRef) => {
      if (!task || seenIds.has(task.id)) return;
      seenIds.add(task.id);
      refs.push(toReference(task, fallbackRef));
    };

    if (decoded && decoded.refs.length > 0) {
      for (const ref of decoded.refs) {
        addTask(tasksByBoardAndId.get(`${log.boardId}:${ref.taskId}`), ref);
      }
    } else {
      const title = legacyTitleForLog(log.type, decoded);
      if (title) {
        const matches = tasksByBoardAndTitle.get(`${log.boardId}\0${title}`);
        if (matches && matches.length === 1) {
          addTask(matches[0]);
        }
      } else if (log.type === "mcp_change" && !isEpicOnlyMcpLog(decoded)) {
        const matched = findClosestUnusedMcpChange(log, mcpChanges, usedMcpChangeIds);
        if (matched) {
          for (const taskId of extractTaskIdsFromSnapshot(matched.after)) {
            addTask(tasksByBoardAndId.get(`${log.boardId}:${taskId}`));
          }
        }
      }
    }

    if (refs.length > 0) {
      result.set(log.id, refs);
    }
  }

  return result;
}
