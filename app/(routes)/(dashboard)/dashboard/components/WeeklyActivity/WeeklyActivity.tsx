"use client";

import { useTranslations } from "next-intl";
import { BarChart2 } from "lucide-react";
import { WeeklyActivityProps } from "./WeeklyActivity.types";

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

function intensityClass(count: number, max: number): string {
  if (count === 0) return "bg-muted";
  if (max === 0) return "bg-muted";
  const ratio = count / max;
  if (ratio <= 0.25) return "bg-emerald-200 dark:bg-emerald-900";
  if (ratio <= 0.5) return "bg-emerald-400 dark:bg-emerald-700";
  if (ratio <= 0.75) return "bg-emerald-500 dark:bg-emerald-500";
  return "bg-emerald-600 dark:bg-emerald-400";
}

export function WeeklyActivity({ days }: WeeklyActivityProps) {
  const t = useTranslations("dashboard");
  const tDays = useTranslations("weekdays");
  const max = Math.max(...days.map((d) => d.count), 0);
  const total = days.reduce((acc, d) => acc + d.count, 0);

  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium">{t("weeklyActivity")}</span>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {t("completedCount", { count: total })}
        </span>
      </div>

      <div className="flex items-end gap-2">
        {days.map((day, i) => {
          const date = new Date(day.date + "T12:00:00");
          const dayName = tDays(WEEKDAY_KEYS[date.getDay() === 0 ? 6 : date.getDay() - 1]);
          const isToday = i === days.length - 1;

          return (
            <div
              key={day.date}
              className="flex flex-col items-center gap-1.5 flex-1"
            >
              {/* Barra */}
              <div
                className="w-full flex flex-col justify-end"
                style={{ height: 48 }}
              >
                <div
                  title={t("completedShort", { count: day.count })}
                  className={`w-full rounded-md transition-all ${intensityClass(day.count, max)} ${day.count === 0 ? "h-1.5" : ""}`}
                  style={
                    day.count > 0
                      ? {
                          height: `${Math.max(8, Math.round((day.count / Math.max(max, 1)) * 48))}px`,
                        }
                      : undefined
                  }
                />
              </div>

              {/* Número */}
              <span
                className={`text-xs tabular-nums font-medium ${day.count > 0 ? "text-foreground" : "text-muted-foreground"}`}
              >
                {day.count > 0 ? day.count : "·"}
              </span>

              {/* Día */}
              <span
                className={`text-[10px] ${isToday ? "text-primary font-semibold" : "text-muted-foreground"}`}
              >
                {dayName}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
