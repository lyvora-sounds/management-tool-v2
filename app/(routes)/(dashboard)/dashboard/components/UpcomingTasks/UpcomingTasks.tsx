"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { CalendarDays, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDueDate } from "@/lib/i18nFormat";
import { UpcomingTasksProps } from "./UpcomingTasks.types";
import { PRIORITY_COLOR } from "./UpcomingTasks.constants";

export function UpcomingTasks({ tasks }: UpcomingTasksProps) {
  const t = useTranslations();
  const locale = useLocale();

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("dashboard.upcomingTasks")}</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-xl border p-4">
          <CalendarDays size={16} className="shrink-0" />
          <span>{t("dashboard.noUpcoming")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("dashboard.upcomingTasks")}</h2>
        <span className="text-xs text-muted-foreground">{t("dashboard.next7Days")}</span>
      </div>

      <div className="flex flex-col gap-2">
        {tasks.map((task) => {
          if (!task.dueDate) return null;
          const due = formatDueDate(task.dueDate, t, locale);
          return (
            <Link
              key={task.id}
              href={`/board/${task.list.board.id}?taskId=${task.id}`}
              className="flex items-center gap-3 rounded-xl border bg-card p-3 hover:bg-muted/50 hover:border-primary/40 transition-colors group cursor-pointer"
            >
              <span className="shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                {task.completed ? (
                  <CheckCircle2 size={16} className="text-primary" />
                ) : due.isOverdue ? (
                  <AlertCircle size={16} className="text-destructive" />
                ) : (
                  <Circle size={16} />
                )}
              </span>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${task.completed ? "line-through text-muted-foreground" : ""}`}
                >
                  {task.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {task.list.board.title} · {task.list.title}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {task.priority && PRIORITY_COLOR[task.priority] && (
                  <span
                    className={`w-2 h-2 rounded-full ${PRIORITY_COLOR[task.priority]}`}
                  />
                )}
                <Badge
                  variant={due.isOverdue ? "destructive" : "secondary"}
                  className="text-xs tabular-nums"
                >
                  {due.label}
                </Badge>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
