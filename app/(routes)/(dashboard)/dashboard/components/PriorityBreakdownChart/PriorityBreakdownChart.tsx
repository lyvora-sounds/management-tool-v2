"use client";

import { useTranslations } from "next-intl";
import { Flame } from "lucide-react";

interface PriorityCounts {
  urgent: number;
  high: number;
  medium: number;
  low: number;
  none: number;
}

interface PriorityBreakdownChartProps {
  counts: PriorityCounts;
}

const R = 38;
const C = 2 * Math.PI * R;

const PRIORITY_ITEMS = [
  { key: "urgent", color: "#ef4444" },
  { key: "high", color: "#f97316" },
  { key: "medium", color: "#eab308" },
  { key: "low", color: "#22c55e" },
  { key: "none", color: "#94a3b8" },
] as const;

export function PriorityBreakdownChart({ counts }: PriorityBreakdownChartProps) {
  const t = useTranslations("dashboard");
  const tPriority = useTranslations("priority");
  const tCommon = useTranslations("common");
  const total =
    counts.urgent + counts.high + counts.medium + counts.low + counts.none;

  const items = PRIORITY_ITEMS.map((item) => ({
    ...item,
    label: tPriority(item.key),
    count: counts[item.key],
  }));

  let acc = 0;
  const segments =
    total === 0
      ? []
      : items
          .filter((item) => item.count > 0)
          .map((item) => {
            const len = (item.count / total) * C;
            const offset = -acc;
            acc += len;
            return { ...item, len, offset };
          });

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-orange-500/10 text-orange-500">
            <Flame size={16} />
          </div>
          <h3 className="text-sm font-semibold">{t("priorityBreakdown")}</h3>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {t("taskCount", { count: total })}
        </span>
      </div>

      <div className="flex items-center justify-around py-3 gap-4">
        {/* SVG Donut */}
        <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {/* Background track */}
            <circle
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke="currentColor"
              className="text-muted/40"
              strokeWidth="12"
            />
            {total > 0 &&
              segments.map((seg) => (
                <circle
                  key={seg.key}
                  cx="50"
                  cy="50"
                  r={R}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="12"
                  strokeDasharray={`${seg.len} ${C - seg.len}`}
                  strokeDashoffset={seg.offset}
                  className="transition-all duration-500 ease-out"
                />
              ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold tabular-nums">{total}</span>
            <span className="text-[10px] text-muted-foreground">{tCommon("total")}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-1.5 text-xs flex-1 max-w-[180px]">
          {items.map((item) => {
            const pct = total === 0 ? 0 : Math.round((item.count / total) * 100);
            return (
              <div
                key={item.key}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate text-muted-foreground">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0 font-medium tabular-nums">
                  <span>{item.count}</span>
                  <span className="text-[10px] text-muted-foreground/70">
                    ({pct}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
