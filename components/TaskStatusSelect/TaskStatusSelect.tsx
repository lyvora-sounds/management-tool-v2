"use client";

import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStatusTheme } from "@/lib/statusTheme";

export type StatusListOption = {
  id: string;
  title: string;
};

export function TaskStatusSelect({
  currentListId,
  currentListTitle,
  completed,
  lists,
  updating = false,
  onSelect,
}: {
  currentListId: string;
  currentListTitle: string;
  completed?: boolean;
  lists: StatusListOption[];
  updating?: boolean;
  onSelect: (listId: string) => void;
}) {
  const statusTheme = getStatusTheme(currentListTitle, completed);

  return (
    <Select
      value={currentListId}
      onValueChange={(val) => {
        if (val && val !== currentListId) onSelect(val);
      }}
    >
      <SelectTrigger
        className={cn(
          "h-7 text-xs font-medium rounded-full border px-2.5 py-1 gap-1.5 transition-all shadow-2xs cursor-pointer select-none",
          statusTheme.bg,
          statusTheme.text,
          statusTheme.border,
        )}
        title="Cambiar estado del ticket"
      >
        {updating ? (
          <Loader2 size={11} className="animate-spin shrink-0" />
        ) : (
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusTheme.dot)} />
        )}
        <span className="truncate max-w-[120px]">{currentListTitle}</span>
      </SelectTrigger>
      <SelectContent align="end" className="w-44">
        {lists.map((list) => {
          const itemTheme = getStatusTheme(list.title);
          return (
            <SelectItem
              key={list.id}
              value={list.id}
              className="text-xs cursor-pointer py-1.5"
            >
              <div className="flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full shrink-0", itemTheme.dot)} />
                <span className="truncate">{list.title}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
