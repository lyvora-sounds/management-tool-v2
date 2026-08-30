"use client";

import { useEffect, useState, useRef } from "react";
import { Search, X, Check, Ticket, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBoardStore } from "../../store/useBoardStore";
import { cn } from "@/lib/utils";
import { getStatusTheme } from "@/lib/statusTheme";
import { parseListValue, stringifyListValue } from "@/lib/customValueUtils";
import { useTranslations } from "next-intl";

interface BoardTaskItem {
  id: string;
  title: string;
  listTitle: string;
}

interface TicketSelectComboboxProps {
  value: string;
  onSelect: (value: string) => void;
  currentTaskId: string;
  boardId: string;
  placeholder?: string;
  isMulti?: boolean;
}

export function TicketSelectCombobox({
  value,
  onSelect,
  currentTaskId,
  boardId,
  placeholder,
  isMulti = false,
}: TicketSelectComboboxProps) {
  const t = useTranslations("task");
  const resolvedPlaceholder = placeholder ?? t("searchSelect");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [boardTasks, setBoardTasks] = useState<BoardTaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const storeLists = useBoardStore((s) => s.lists);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (storeLists && storeLists.length > 0) {
          setBoardTasks(
            storeLists.flatMap((list) =>
              list.tasks
                .filter((t) => t.id !== currentTaskId)
                .map((t) => ({
                  id: t.id,
                  title: t.title,
                  listTitle: list.title,
                })),
            ),
          );
          return;
        }

        const res = await fetch(`/api/boards/${boardId}/tasks`);
        if (!res.ok) return;
        const data = await res.json();
        setBoardTasks(
          (data.tasks || [])
            .filter((t: { id: string }) => t.id !== currentTaskId)
            .map((t: { id: string; title: string; listTitle: string }) => ({
              id: t.id,
              title: t.title,
              listTitle: t.listTitle,
            })),
        );
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [storeLists, boardId, currentTaskId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedIds = isMulti ? parseListValue(value) : [];
  const selectedTask = !isMulti ? boardTasks.find((t) => t.id === value) : null;
  const titleById = new Map(boardTasks.map((t) => [t.id, t.title]));

  const handleToggleMultiItem = (taskId: string) => {
    const next = selectedIds.includes(taskId)
      ? selectedIds.filter((id) => id !== taskId)
      : [...selectedIds, taskId];
    onSelect(stringifyListValue(next));
  };

  const searchLower = search.toLowerCase();
  const filteredTasks = boardTasks.filter(
    (t) =>
      t.title.toLowerCase().includes(searchLower) ||
      t.listTitle.toLowerCase().includes(searchLower),
  );

  const displaySingleTitle = selectedTask?.title || (value ? titleById.get(value) || value : resolvedPlaceholder);

  return (
    <div className="relative w-full space-y-1.5" ref={dropdownRef}>
      {isMulti && selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedIds.map((taskId) => (
            <Badge
              key={taskId}
              variant="secondary"
              className="text-[11px] font-medium gap-1 bg-muted px-2 py-0.5"
            >
              <Ticket size={11} className="text-primary shrink-0" />
              <span className="truncate max-w-40">{titleById.get(taskId) ?? taskId}</span>
              <button
                type="button"
                onClick={() => handleToggleMultiItem(taskId)}
                className="hover:text-destructive shrink-0 cursor-pointer ml-0.5"
              >
                <X size={11} />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            "w-full min-h-8 px-2.5 py-1 rounded-md border bg-background text-xs font-normal flex items-center justify-between gap-2 hover:bg-muted/40 transition-colors text-left outline-none focus:ring-1 focus:ring-ring",
            (!value || (isMulti && selectedIds.length === 0)) && "text-muted-foreground",
          )}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {!isMulti ? (
              <>
                <Ticket size={13} className="text-primary shrink-0" />
                <span className="truncate">{displaySingleTitle}</span>
              </>
            ) : (
              <span className="truncate">
                {selectedIds.length > 0
                  ? t("addMoreSelected", { count: selectedIds.length })
                  : resolvedPlaceholder}
              </span>
            )}
          </div>
          <ChevronDown size={13} className="opacity-50 shrink-0" />
        </button>

        {value && !isMulti && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onSelect("")}
            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
            title={t("clearSelection")}
          >
            <X size={13} />
          </Button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border bg-popover text-popover-foreground shadow-xl p-2 space-y-2 max-h-64 overflow-hidden flex flex-col">
          <div className="relative shrink-0">
            <Search size={13} className="absolute left-2.5 top-2.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchByName")}
              className="w-full h-8 pl-8 pr-2 text-xs bg-muted/50 rounded-md border-0 outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
          </div>

          <div className="overflow-y-auto flex-1 space-y-1 pr-1">
            {loading ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                {t("loadingItems")}
              </p>
            ) : filteredTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                {t("noTicketsOnBoard")}
              </p>
            ) : (
              filteredTasks.map((t) => {
                const isSelected = isMulti
                  ? selectedIds.includes(t.id)
                  : value === t.id;
                const statusTheme = getStatusTheme(t.listTitle);

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      if (isMulti) {
                        handleToggleMultiItem(t.id);
                      } else {
                        onSelect(t.id);
                        setOpen(false);
                        setSearch("");
                      }
                    }}
                    className={cn(
                      "w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between gap-2 hover:bg-muted transition-colors cursor-pointer",
                      isSelected && "bg-primary/10 font-medium text-primary",
                    )}
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="truncate font-medium">{t.title}</p>
                      <div className="flex items-center gap-1">
                        <span className={cn("w-1.5 h-1.5 rounded-full", statusTheme.dot)} />
                        <span className="text-[10px] text-muted-foreground">
                          {t.listTitle}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check size={14} className="text-primary shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
