"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL = 25_000; // 25 segundos

export function useBoardPolling(onRefresh?: () => Promise<void>) {
  const router = useRouter();

  useEffect(() => {
    let refreshing = false;
    const refresh = () => {
      if (document.visibilityState !== "visible" || refreshing) return;
      if (!onRefresh) return router.refresh();
      refreshing = true;
      // Retry background failures at the next interval without showing repeated errors.
      void onRefresh().catch(() => {}).finally(() => { refreshing = false; });
    };

    const interval = setInterval(refresh, POLL_INTERVAL);

    // También refresca cuando el usuario vuelve a la pestaña
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [router, onRefresh]);
}
