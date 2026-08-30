"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocale, useTranslations } from "next-intl";
import { dateLocale } from "@/i18n/routing";
import { FormattedLogMessage } from "@/components/Shared/FormattedLogMessage";
import type { ActivityLog, BoardActivityProps } from "./BoardActivity.types";
import { TYPE_ICON } from "./BoardActivity.constants";
import { ActivitySkeleton } from "@/components/skeletons";

export function BoardActivity({ boardId, open, onClose }: BoardActivityProps) {
  const t = useTranslations("board");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setLoading(true), 0);
    const controller = new AbortController();
    fetch(`/api/boards/${boardId}/activity`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setLogs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [open, boardId]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-4 py-4 border-b bg-muted/50">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Activity size={16} />
            {t("activityTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh] flex flex-col divide-y px-1">
          {loading && <ActivitySkeleton count={5} />}
          {!loading && logs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("activityEmpty")}
            </p>
          )}
          {!loading &&
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 px-3 py-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium mt-0.5">
                  {TYPE_ICON[log.type] ?? "•"}
                </span>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm leading-snug">
                    <FormattedLogMessage message={log.message} />
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString(dateLocale(locale), {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
        </div>

        <div className="border-t px-4 py-3 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            {tCommon("close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
