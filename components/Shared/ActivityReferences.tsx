"use client";

import { useState } from "react";
import Link from "next/link";
import { Link2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { fallbackActivityReferences, type ActivityReference } from "@/lib/activityReferences";

const INITIAL_VISIBLE = 5;

export function ActivityReferences({
  boardId,
  message,
  references,
  onNavigate,
}: {
  boardId: string;
  message: string;
  references?: ActivityReference[];
  onNavigate?: () => void;
}) {
  const t = useTranslations("activity");
  const [expanded, setExpanded] = useState(false);

  const items =
    references !== undefined
      ? references
      : fallbackActivityReferences(boardId, message);

  if (items.length === 0) return null;

  const visible = expanded ? items : items.slice(0, INITIAL_VISIBLE);
  const hiddenCount = items.length - visible.length;

  return (
    <div className="mt-1 flex flex-col gap-0.5">
      <ul role="list" className="flex flex-col gap-0.5">
        {visible.map((ref) => {
          const href = `/board/${encodeURIComponent(boardId)}?taskId=${encodeURIComponent(ref.taskId)}`;
          return (
            <li key={ref.taskId} className="min-w-0">
              <Link
                href={href}
                title={ref.url}
                onClick={() => onNavigate?.()}
                className="inline-flex max-w-full min-h-6 items-center gap-1.5 rounded-sm py-0.5 text-xs text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Link2 size={12} className="shrink-0" aria-hidden="true" />
                {ref.ticketKey && (
                  <span className="shrink-0 font-mono text-[11px] font-medium text-muted-foreground">
                    {ref.ticketKey}
                  </span>
                )}
                <span className="truncate">{ref.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      {items.length > INITIAL_VISIBLE && (
        <div>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex min-h-6 items-center rounded-sm py-0.5 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {expanded
              ? t("showFewerTickets")
              : t("showMoreTickets", { count: hiddenCount })}
          </button>
        </div>
      )}
    </div>
  );
}
