"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export function TaskHierarchyDiagram({
  boardId,
  taskId,
  refreshKey,
}: {
  boardId: string;
  taskId: string;
  refreshKey: number;
}) {
  const t = useTranslations("task");
  const kicker = t("hierarchyKicker");
  const note = t("hierarchyNote");
  const requestKey = `${boardId}\0${taskId}\0${refreshKey}\0${kicker}\0${note}`;
  const [loaded, setLoaded] = useState<{ key: string; svg: string | null } | null>(null);
  const svg = loaded?.key === requestKey ? loaded.svg : null;

  useEffect(() => {
    let cancelled = false;
    const key = requestKey;
    const params = new URLSearchParams({ taskId, kicker, note });
    (async () => {
      try {
        const res = await fetch(`/api/boards/${boardId}/hierarchy?${params}`);
        const data = res.ok ? await res.json() : null;
        if (!cancelled) setLoaded({ key, svg: typeof data?.svg === "string" ? data.svg : null });
      } catch {
        if (!cancelled) setLoaded({ key, svg: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [requestKey, boardId, taskId, kicker, note]);

  if (!svg?.startsWith("<svg")) return null;

  return (
    // The details column is a flex scroller. overflow-x-auto would otherwise
    // let that column shrink this box to the SVG's min-content height.
    <div
      className="min-h-max shrink-0 overflow-x-auto rounded-lg border bg-[#F7F7F7] [&_svg]:block [&_svg]:h-auto [&_svg]:max-w-none [&_svg]:min-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
