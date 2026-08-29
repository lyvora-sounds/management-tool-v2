"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  PRIORITIES,
  getPriority,
  TaskPriorityProps,
  type Priority,
} from "./TaskPriority.constants";

export function TaskPriority({ taskId, priority, onSaved }: TaskPriorityProps) {
  const tPriority = useTranslations("priority");
  const tTask = useTranslations("task");
  const [open, setOpen] = useState(false);
  const current = getPriority(priority);

  const select = async (value: Priority | null) => {
    setOpen(false);
    const prev = priority;
    onSaved(value);
    const res = await fetch(`/api/tasks/updateTask/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority: value }),
    });
    if (res.ok) {
      toast.success(
        value
          ? tPriority("set", { label: tPriority(value) })
          : tPriority("removed"),
      );
    } else {
      onSaved(prev as Priority | null);
      toast.error(tTask("priorityError"));
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn(current && current.bg, "gap-1.5")}
          >
            <Flag size={13} />
            {current ? tPriority(current.value) : tPriority("label")}
          </Button>
        }
      />
      <PopoverContent className="w-44 p-1 flex flex-col gap-0.5">
        {PRIORITIES.map((p) => (
          <button
            key={p.value}
            onClick={() => select(p.value)}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors hover:bg-muted w-full text-left",
              priority === p.value && "font-medium",
            )}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: p.color }}
            />
            {tPriority(p.value)}
          </button>
        ))}
        {priority && (
          <>
            <div className="h-px bg-border my-0.5" />
            <button
              onClick={() => select(null)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted w-full text-left transition-colors"
            >
              {tPriority("remove")}
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
