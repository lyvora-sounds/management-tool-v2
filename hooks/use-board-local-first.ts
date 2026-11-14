"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ListWithTasks } from "@/app/(routes)/(dashboard)/board/[boardId]/components/TaskCard/TaskCard.types";
import { useBoardStore } from "@/app/(routes)/(dashboard)/board/[boardId]/store/useBoardStore";
import { deleteBoardCache, readBoardCache, writeBoardCache } from "@/lib/local-first/boardCache";
import { isBoardEventStreamConfigured, isLocalFirstEnabled } from "@/lib/local-first/flags";
import { flushOutbox } from "@/lib/local-first/outbox";
import { openBoardEventStream } from "@/lib/local-first/sse";

type Options = {
  boardId: string;
  initialLists: ListWithTasks[];
};

/**
 * Strategy A client: hydrate Zustand from IndexedDB, persist snapshots, SSE invalidate via
 * router.refresh(), flush outbox on reconnect. Safe no-op when local-first is disabled —
 * RSC snapshots still always win into the store.
 */
export function useBoardLocalFirst({ boardId, initialLists }: Options) {
  const router = useRouter();
  const setLists = useBoardStore((s) => s.setLists);
  const lists = useBoardStore((s) => s.lists);
  const serverSynced = useRef(false);
  const skipPersist = useRef(false);
  const lastRemoteEvent = useRef(0);

  // Warm start from IndexedDB only if RSC has not applied yet (avoid stale overwrite).
  useEffect(() => {
    if (!isLocalFirstEnabled()) return;
    serverSynced.current = false;
    let cancelled = false;
    void (async () => {
      try {
        const cached = await readBoardCache(boardId);
        // null = miss; [] is a real empty snapshot and must be allowed to apply before RSC.
        if (cancelled || serverSynced.current || cached === null) return;
        skipPersist.current = true;
        setLists(cached);
      } catch {
        /* private mode / quota */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [boardId, setLists]);

  // Authoritative RSC snapshot wins when it arrives / refreshes — including [].
  useEffect(() => {
    serverSynced.current = true;
    skipPersist.current = true;
    setLists(initialLists);
    if (isLocalFirstEnabled()) {
      void writeBoardCache(boardId, initialLists).catch(() => {});
    }
  }, [boardId, initialLists, setLists]);

  // Persist client mutations (DnD, etc.) for the next visit, including empty boards.
  useEffect(() => {
    if (!isLocalFirstEnabled()) return;
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    const handle = window.setTimeout(() => {
      void writeBoardCache(boardId, lists).catch(() => {});
    }, 250);
    return () => window.clearTimeout(handle);
  }, [boardId, lists]);

  // Flush outbox when we come online / mount.
  useEffect(() => {
    if (!isLocalFirstEnabled()) return;
    const flush = () => {
      void flushOutbox().catch(() => {});
    };
    flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, [boardId]);

  // SSE → soft refresh. Refetch on every ready (reconnect gap) and on domain frames.
  useEffect(() => {
    if (!isLocalFirstEnabled() || !isBoardEventStreamConfigured()) return;

    const ac = new AbortController();
    let stopped = false;
    let delayMs = 1_000;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    const refresh = () => {
      const now = Date.now();
      if (now - lastRemoteEvent.current < 400) return;
      lastRemoteEvent.current = now;
      router.refresh();
    };

    const connect = async () => {
      while (!stopped && !ac.signal.aborted) {
        const result = await openBoardEventStream(
          boardId,
          {
            onReady: () => refresh(),
            onDomain: () => refresh(),
          },
          ac.signal,
        );
        if (stopped || ac.signal.aborted) return;
        if (result === "skipped") return;
        if (result === "forbidden") {
          void deleteBoardCache(boardId).catch(() => {});
          return;
        }
        if (result === "connected") delayMs = 1_000;
        else delayMs = Math.min(delayMs * 2, 30_000);
        await new Promise<void>((resolve) => {
          reconnectTimer = setTimeout(resolve, delayMs);
        });
      }
    };

    void connect();
    return () => {
      stopped = true;
      ac.abort();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [boardId, router]);
}
