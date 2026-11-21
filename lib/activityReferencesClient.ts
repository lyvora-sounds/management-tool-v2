import { decodeLogMessage } from "@/lib/activityMessages";

/** Resolved ticket link shown in Board / Dashboard activity. */
export type ActivityReference = {
  taskId: string;
  ticketKey: string | null;
  title: string;
  url: string;
};

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

/**
 * Client-only resolver used when the activity payload omits `references`
 * (transitional while older API builds omit the field). Relies solely on
 * embedded `r` stubs in the message. An empty array from the server means
 * "resolved, no links" and must not call this.
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
