"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Activity } from "lucide-react";
import { formatRelativeTime } from "@/lib/i18nFormat";
import { FormattedLogMessage } from "@/components/Shared/FormattedLogMessage";
import { RecentActivityProps } from "./RecentActivity.types";
import { TYPE_ICON } from "./RecentActivity.constants";

export function RecentActivity({ logs }: RecentActivityProps) {
  const t = useTranslations();
  const locale = useLocale();

  if (logs.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("dashboard.recentActivity")}</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-xl border p-4">
          <Activity size={16} className="shrink-0" />
          <span>{t("dashboard.noActivity")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{t("dashboard.recentActivity")}</h2>
      <div className="flex flex-col divide-y rounded-xl border bg-card overflow-hidden">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-3 px-4 py-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs mt-0.5">
              {TYPE_ICON[log.type] ?? "•"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-snug">
                <FormattedLogMessage message={log.message} />
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Link
                  href={`/board/${log.board.id}`}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors truncate"
                >
                  {log.board.title}
                </Link>
              </div>
            </div>
            <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
              {formatRelativeTime(log.createdAt, t, locale)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
