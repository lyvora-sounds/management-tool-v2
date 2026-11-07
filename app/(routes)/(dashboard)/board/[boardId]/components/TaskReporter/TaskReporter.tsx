"use client";

import { useState } from "react";
import { Check, Flag, Info, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Props } from "./TaskReporter.types";
import type { BoardUser } from "../TaskCard/TaskCard.types";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/apiClient";

function getInitials(name: string | null, email: string) {
  if (name)
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  return email[0].toUpperCase();
}

function InfoHint({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-expanded={open}
        aria-label={text}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Info size={13} aria-hidden />
      </button>
      <span
        role="tooltip"
        hidden={!open}
        className="absolute top-full left-0 z-30 mt-1 w-60 rounded-md bg-foreground px-2.5 py-1.5 text-left text-xs leading-relaxed font-normal text-background shadow-md"
      >
        {text}
      </span>
    </span>
  );
}

export function TaskReporter({
  taskId,
  boardUsers,
  reporter,
  canManage,
  memberCanAssign,
  onReporterChange,
}: Props) {
  const t = useTranslations("task");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);

  const selectUser = async (user: BoardUser | null) => {
    const nextUser = reporter?.id === user?.id ? null : user;
    onReporterChange(nextUser);
    setOpen(false);

    await apiFetch(`/api/tasks/${taskId}/reporter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reporterId: nextUser ? nextUser.id : null }),
    });
  };

  if (!canManage && !memberCanAssign) {
    if (!reporter) return null;
    return (
      <div className="flex items-center gap-1.5 border rounded-md px-2 py-1 h-8 bg-muted/40 text-xs">
        <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
          {t("reporterLabel")}:
        </span>
        <InfoHint text={t("reporterHint")} />
        <div
          title={reporter.name ?? reporter.email}
          className="w-5 h-5 rounded-full bg-sky-600 text-white text-[10px] font-semibold flex items-center justify-center"
        >
          {getInitials(reporter.name, reporter.email)}
        </div>
        <span className="truncate max-w-28 font-medium">
          {reporter.name ?? reporter.email}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 gap-1.5",
                reporter &&
                  "border-sky-500/40 bg-sky-500/5 text-sky-700 dark:text-sky-300",
              )}
            >
              <Flag
                size={14}
                className={
                  reporter
                    ? "text-sky-600 dark:text-sky-400"
                    : "text-muted-foreground"
                }
              />
              <span>
                {reporter ? `${t("reporterLabel")}:` : t("reporterLabel")}
              </span>
              {reporter && (
                <div
                  title={reporter.name ?? reporter.email}
                  className="w-5 h-5 rounded-full bg-sky-600 text-white text-[10px] font-semibold flex items-center justify-center -mr-1"
                >
                  {getInitials(reporter.name, reporter.email)}
                </div>
              )}
            </Button>
          }
        />
        <PopoverContent className="w-60 flex flex-col gap-1 p-2" align="start">
          <div className="flex items-center justify-between gap-2 px-1 pb-1.5 border-b mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground">
                {t("reporterTitle")}
              </p>
              <InfoHint text={t("reporterHint")} />
            </div>
            {reporter && (
              <button
                onClick={() => selectUser(null)}
                className="text-[11px] text-muted-foreground hover:text-destructive flex items-center gap-0.5 cursor-pointer shrink-0"
              >
                <X size={12} />
                {tCommon("remove")}
              </button>
            )}
          </div>

          {boardUsers.length === 0 && (
            <p className="text-xs text-muted-foreground px-1 py-2">
              {t("noMembers")}
            </p>
          )}

          <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto">
            {boardUsers.map((user) => {
              const isSelected = reporter?.id === user.id;
              return (
                <button
                  key={user.id}
                  onClick={() => selectUser(user)}
                  className={cn(
                    "flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted transition-colors w-full text-left cursor-pointer",
                    isSelected &&
                      "bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300 font-medium",
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-sky-600/20 text-sky-600 text-xs font-semibold flex items-center justify-center shrink-0">
                      {getInitials(user.name, user.email)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs truncate">
                        {user.name ?? user.email}
                      </p>
                      {user.name && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <Check size={14} className="shrink-0 text-sky-600" />
                  )}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
      <InfoHint text={t("reporterHint")} />
    </div>
  );
}
