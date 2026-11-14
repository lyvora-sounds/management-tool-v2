"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isBoardEventStreamConfigured, isLocalFirstEnabled } from "@/lib/local-first/flags";

const POLL_INTERVAL = 25_000; // 25 segundos
/** When SSE is configured, poll less often as a safety net for multi-instance EventBus gaps. */
const POLL_INTERVAL_WITH_SSE = 60_000;

export function useBoardPolling(onRefresh?: () => Promise<void>) {
  const router = useRouter();
  const intervalMs =
    isLocalFirstEnabled() && isBoardEventStreamConfigured() ? POLL_INTERVAL_WITH_SSE : POLL_INTERVAL;

  useEffect(() => {
    let refreshing = false;
    const refresh = () => {
      if (document.visibilityState !== "visible" || refreshing) return;
      if (!onRefresh) return router.refresh();
      refreshing = true;
      // Retry background failures at the next interval without showing repeated errors.
      void onRefresh().catch(() => {}).finally(() => { refreshing = false; });
    };

    const interval = setInterval(refresh, intervalMs);

    // También refresca cuando el usuario vuelve a la pestaña
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [router, onRefresh, intervalMs]);
}
