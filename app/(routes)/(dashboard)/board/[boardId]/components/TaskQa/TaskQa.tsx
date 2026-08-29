"use client";

import { useState } from "react";
import { ShieldCheck, Check, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Props } from "./TaskQa.types";
import type { BoardUser } from "../TaskCard/TaskCard.types";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

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

export function TaskQa({
  taskId,
  boardUsers,
  qa,
  isOwner,
  memberCanAssign,
  onQaChange,
}: Props) {
  const t = useTranslations("task");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);

  const selectUser = async (user: BoardUser | null) => {
    const nextUser = qa?.id === user?.id ? null : user;
    onQaChange(nextUser);
    setOpen(false);

    await fetch(`/api/tasks/${taskId}/qa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qaId: nextUser ? nextUser.id : null }),
    });
  };

  if (!isOwner && !memberCanAssign) {
    if (!qa) return null;
    return (
      <div className="flex items-center gap-1.5 border rounded-md px-2 py-1 h-8 bg-muted/40 text-xs">
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{t("qaLabel")}:</span>
        <div
          title={qa.name ?? qa.email}
          className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-semibold flex items-center justify-center"
        >
          {getInitials(qa.name, qa.email)}
        </div>
        <span className="truncate max-w-28 font-medium">
          {qa.name ?? qa.email}
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
                qa && "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
              )}
            >
              <ShieldCheck size={14} className={qa ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"} />
              <span>{qa ? `${t("qaLabel")}:` : t("qaLabel")}</span>
              {qa && (
                <div
                  title={qa.name ?? qa.email}
                  className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-semibold flex items-center justify-center -mr-1"
                >
                  {getInitials(qa.name, qa.email)}
                </div>
              )}
            </Button>
          }
        />
        <PopoverContent className="w-60 flex flex-col gap-1 p-2" align="start">
          <div className="flex items-center justify-between px-1 pb-1.5 border-b mb-1">
            <p className="text-xs font-semibold text-muted-foreground">
              {t("qaQuality")}
            </p>
            {qa && (
              <button
                onClick={() => selectUser(null)}
                className="text-[11px] text-muted-foreground hover:text-destructive flex items-center gap-0.5 cursor-pointer"
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
              const isSelected = qa?.id === user.id;
              return (
                <button
                  key={user.id}
                  onClick={() => selectUser(user)}
                  className={cn(
                    "flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted transition-colors w-full text-left cursor-pointer",
                    isSelected && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 font-medium"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-emerald-600/20 text-emerald-600 text-xs font-semibold flex items-center justify-center shrink-0">
                      {getInitials(user.name, user.email)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs truncate">{user.name ?? user.email}</p>
                      {user.name && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {isSelected && <Check size={14} className="shrink-0 text-emerald-600" />}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
