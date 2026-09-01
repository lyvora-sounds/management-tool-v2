"use client";

import { useState } from "react";
import { User, Check, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Props } from "./TaskAssignee.types";
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

export function TaskAssignee({
  taskId,
  boardUsers,
  assignee,
  canManage,
  memberCanAssign,
  onAssigneeChange,
}: Props) {
  const t = useTranslations("task");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);

  const selectUser = async (user: BoardUser | null) => {
    // If clicked the already assigned user, unassign
    const nextUser = assignee?.id === user?.id ? null : user;
    onAssigneeChange(nextUser);
    setOpen(false);

    await fetch(`/api/tasks/${taskId}/assignee`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeId: nextUser ? nextUser.id : null }),
    });
  };

  if (!canManage && !memberCanAssign) {
    if (!assignee) return null;
    return (
      <div className="flex items-center gap-1.5 border rounded-md px-2 py-1 h-8 bg-muted/40 text-xs">
        <div
          title={assignee.name ?? assignee.email}
          className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center"
        >
          {getInitials(assignee.name, assignee.email)}
        </div>
        <span className="truncate max-w-28 font-medium">
          {assignee.name ?? assignee.email}
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
              className={cn("h-8 gap-1.5", assignee && "border-primary/40 bg-primary/5")}
            >
              <User size={14} className={assignee ? "text-primary" : "text-muted-foreground"} />
              <span>{assignee ? t("assigned") : t("assign")}</span>
              {assignee && (
                <div
                  title={assignee.name ?? assignee.email}
                  className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center -mr-1"
                >
                  {getInitials(assignee.name, assignee.email)}
                </div>
              )}
            </Button>
          }
        />
        <PopoverContent className="w-60 flex flex-col gap-1 p-2" align="start">
          <div className="flex items-center justify-between px-1 pb-1.5 border-b mb-1">
            <p className="text-xs font-semibold text-muted-foreground">
              {t("assignedOwner")}
            </p>
            {assignee && (
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
              const isSelected = assignee?.id === user.id;
              return (
                <button
                  key={user.id}
                  onClick={() => selectUser(user)}
                  className={cn(
                    "flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted transition-colors w-full text-left cursor-pointer",
                    isSelected && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
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

                  {isSelected && <Check size={14} className="shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
