import { createClerkTokenSource } from "@/lib/apiClient";

export type DomainEventPayload = {
  id: string;
  type: string;
  boardId: string;
  actorId: string;
  occurredAt: string;
  ticketId?: string;
  listId?: string;
};

export type BoardEventHandlers = {
  onReady?: (boardId: string) => void;
  onDomain: (event: DomainEventPayload) => void;
  onError?: (error: unknown) => void;
};

const getToken = createClerkTokenSource(() => (typeof window === "undefined" ? undefined : window.Clerk));

/** Parse one or more SSE frames from a text buffer; returns leftover partial frame. */
export function consumeSseBuffer(
  buffer: string,
  onFrame: (event: string, data: string, id?: string) => void,
): string {
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";
  for (const part of parts) {
    if (!part.trim() || part.startsWith(":")) continue;
    let event = "message";
    let data = "";
    let id: string | undefined;
    for (const line of part.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) data += (data ? "\n" : "") + line.slice(5).trimStart();
      else if (line.startsWith("id:")) id = line.slice(3).trim();
    }
    if (data) onFrame(event, data, id);
  }
  return rest;
}

/**
 * Authenticated SSE to kiki-api. Returns `"skipped"` when NEXT_PUBLIC_API_URL is unset (local
 * dual-run without the API) — callers keep polling. Abort via signal.
 */
export async function openBoardEventStream(
  boardId: string,
  handlers: BoardEventHandlers,
  signal: AbortSignal,
  options: { baseUrl?: string; getToken?: () => Promise<string | null>; fetchImpl?: typeof fetch } = {},
): Promise<"connected" | "skipped" | "forbidden" | "failed"> {
  const base = (options.baseUrl ?? process.env.NEXT_PUBLIC_API_URL)?.replace(/\/+$/, "");
  if (!base) return "skipped";

  const token = await (options.getToken ?? getToken)();
  if (!token) return "skipped";

  try {
    const response = await (options.fetchImpl ?? fetch)(`${base}/v1/boards/${encodeURIComponent(boardId)}/events`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
      signal,
    });
    if (response.status === 401 || response.status === 403) {
      handlers.onError?.(new Error(`sse ${response.status}`));
      return "forbidden";
    }
    if (!response.ok || !response.body) {
      handlers.onError?.(new Error(`sse ${response.status}`));
      return "failed";
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (!signal.aborted) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      buffer = consumeSseBuffer(buffer, (event, data) => {
        try {
          const parsed = JSON.parse(data) as DomainEventPayload & { boardId?: string };
          if (event === "ready") handlers.onReady?.(parsed.boardId ?? boardId);
          else if (event === "domain") handlers.onDomain(parsed);
        } catch (error) {
          handlers.onError?.(error);
        }
      });
    }
    return "connected";
  } catch (error) {
    if (signal.aborted) return "connected";
    handlers.onError?.(error);
    return "failed";
  }
}
