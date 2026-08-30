"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Props } from "./TaskCollaborators.types";
import type { BoardUser, TaskCollaborator } from "../TaskCard/TaskCard.types";
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

export function TaskCollaborators({
  taskId,
  boardUsers,
  collaborators,
  isOwner,
  memberCanAssign,
  onCollaboratorsChange,
}: Props) {
  const t = useTranslations("task");
  const [open, setOpen] = useState(false);
  const activeIds = new Set(collaborators.map((c) => c.user.id));

  const toggle = async (user: BoardUser) => {
    const nextIds = new Set(activeIds);
    if (nextIds.has(user.id)) {
      nextIds.delete(user.id);
    } else {
      nextIds.add(user.id);
    }

    const nextCollaborators: TaskCollaborator[] = boardUsers
      .filter((u) => nextIds.has(u.id))
      .map((u) => ({ user: u }));

    onCollaboratorsChange(nextCollaborators);

    await fetch(`/api/tasks/${taskId}/collaborators`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collaboratorId: user.id }),
    });
  };

  const assigned = boardUsers.filter((u) => activeIds.has(u.id));

  if (!isOwner && !memberCanAssign) {
    if (assigned.length === 0) return null;
    return (
      <div className="flex items-center gap-1.5 border rounded-md px-2 py-1 h-8 bg-muted/40 text-xs">
        <div className="flex -space-x-1.5">
          {assigned.map((u) => (
            <div
              key={u.id}
              title={u.name ?? u.email}
              className="w-5 h-5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-medium flex items-center justify-center ring-1 ring-background"
            >
              {getInitials(u.name, u.email)}
            </div>
          ))}
        </div>
        <span className="text-xs text-muted-foreground truncate max-w-32">
          {assigned.map((u) => u.name ?? u.email).join(", ")}
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
                assigned.length > 0 && "border-blue-500/40 bg-blue-500/5 text-blue-600 dark:text-blue-400"
              )}
            >
              <Users size={14} className={assigned.length > 0 ? "text-blue-500" : "text-muted-foreground"} />
              <span>{t("collaborators")}</span>
              {assigned.length > 0 && (
                <div className="flex -space-x-1.5 items-center -mr-1">
                  {assigned.slice(0, 3).map((u) => (
                    <div
                      key={u.id}
                      title={u.name ?? u.email}
                      className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-semibold flex items-center justify-center ring-1 ring-background"
                    >
                      {getInitials(u.name, u.email)}
                    </div>
                  ))}
                  {assigned.length > 3 && (
                    <span className="text-[10px] font-medium pl-1 text-muted-foreground">
                      +{assigned.length - 3}
                    </span>
                  )}
                </div>
              )}
            </Button>
          }
        />
        <PopoverContent className="w-60 flex flex-col gap-1 p-2" align="start">
          <div className="px-1 pb-1.5 border-b mb-1">
            <p className="text-xs font-semibold text-muted-foreground">
              {t("collaboratorsCount", { count: assigned.length })}
            </p>
          </div>

          {boardUsers.length === 0 && (
            <p className="text-xs text-muted-foreground px-1 py-2">
              {t("noMembers")}
            </p>
          )}

          <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto">
            {boardUsers.map((user) => {
              const isChecked = activeIds.has(user.id);
              return (
                <button
                  key={user.id}
                  onClick={() => toggle(user)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted transition-colors w-full text-left cursor-pointer",
                    isChecked && "bg-blue-50/60 dark:bg-blue-950/30"
                  )}
                >
                  <Checkbox
                    checked={isChecked}
                    readOnly
                    className="pointer-events-none shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs truncate">{user.name ?? user.email}</p>
                    {user.name && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {user.email}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
