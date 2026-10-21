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
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ taskId, kicker, note });
    (async () => {
      try {
        const res = await fetch(`/api/boards/${boardId}/hierarchy?${params}`);
        const data = res.ok ? await res.json() : null;
        if (!cancelled) setSvg(typeof data?.svg === "string" ? data.svg : null);
      } catch {
        if (!cancelled) setSvg(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [boardId, taskId, refreshKey, kicker, note]);

  if (!svg?.startsWith("<svg")) return null;

  return (
    <div
      className="overflow-x-auto rounded-lg border bg-[#F7F7F7] [&_svg]:h-auto [&_svg]:max-w-none [&_svg]:min-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
