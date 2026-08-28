"use client";

import { useEffect, useState, useRef } from "react";
import { Search, X, Check, Ticket, ChevronDown, Layers, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBoardStore } from "../../store/useBoardStore";
import { cn } from "@/lib/utils";
import { getStatusTheme } from "@/lib/statusTheme";
import { parseListValue, stringifyListValue } from "@/lib/customValueUtils";

interface BoardTaskItem {
  id: string;
  title: string;
  listTitle: string;
  type: "task";
}

interface BoardEpicItem {
  id: string;
  title: string;
  color?: string;
  type: "epic";
}

interface TicketSelectComboboxProps {
  value: string;
  onSelect: (value: string) => void;
  currentTaskId: string;
  boardId: string;
  placeholder?: string;
  allowEpics?: boolean;
  isMulti?: boolean;
}

export function TicketSelectCombobox({
  value,
  onSelect,
  currentTaskId,
  boardId,
  placeholder = "Buscar y seleccionar...",
  allowEpics = true,
  isMulti = false,
}: TicketSelectComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [boardTasks, setBoardTasks] = useState<BoardTaskItem[]>([]);
  const [boardEpics, setBoardEpics] = useState<BoardEpicItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const storeLists = useBoardStore((s) => s.lists);

  useEffect(() => {
    fetchBoardData();
  }, [storeLists, boardId, currentTaskId]);

  const fetchBoardData = async () => {
    try {
      setLoading(true);
      if (storeLists && storeLists.length > 0) {
        const flatTasks: BoardTaskItem[] = storeLists.flatMap((list) =>
          list.tasks
            .filter((t) => t.id !== currentTaskId)
            .map((t) => ({
              id: t.id,
              title: t.title,
              listTitle: list.title,
              type: "task" as const,
            }))
        );
        setBoardTasks(flatTasks);
      }

      const res = await fetch(`/api/boards/${boardId}/tasks`);
      if (res.ok) {
        const data = await res.json();
        if (!storeLists || storeLists.length === 0) {
          const tasks: BoardTaskItem[] = (data.tasks || [])
            .filter((t: any) => t.id !== currentTaskId)
            .map((t: any) => ({ ...t, type: "task" as const }));
          setBoardTasks(tasks);
        }
        if (data.epics) {
          const epics: BoardEpicItem[] = data.epics.map((e: any) => ({
            id: e.id,
            title: e.title,
            color: e.color,
            type: "epic" as const,
          }));
          setBoardEpics(epics);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedList = isMulti ? parseListValue(value) : [];

  const handleToggleMultiItem = (itemTitle: string) => {
    let nextList: string[];
    if (selectedList.includes(itemTitle)) {
      nextList = selectedList.filter((t) => t !== itemTitle);
    } else {
      nextList = [...selectedList, itemTitle];
    }
    onSelect(stringifyListValue(nextList));
  };

  const handleRemoveMultiItem = (itemTitle: string) => {
    const nextList = selectedList.filter((t) => t !== itemTitle);
    onSelect(stringifyListValue(nextList));
  };

  const searchLower = search.toLowerCase();

  const filteredEpics = allowEpics
    ? boardEpics.filter((e) => e.title.toLowerCase().includes(searchLower))
    : [];

  const filteredTasks = boardTasks.filter(
    (t) =>
      t.title.toLowerCase().includes(searchLower) ||
      t.listTitle.toLowerCase().includes(searchLower)
  );

  const selectedEpic = !isMulti
    ? boardEpics.find(
        (e) => e.title === value || `[EPIC] ${e.title}` === value || e.id === value
      )
    : null;
  const selectedTask = !isMulti
    ? boardTasks.find((t) => t.title === value || t.id === value)
    : null;

  const displaySingleTitle = selectedEpic
    ? `[EPIC] ${selectedEpic.title}`
    : selectedTask
      ? selectedTask.title
      : value || placeholder;

  return (
    <div className="relative w-full space-y-1.5" ref={dropdownRef}>
      {/* Multi-select badges list */}
      {isMulti && selectedList.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedList.map((itemTitle) => {
            const isEpic = itemTitle.startsWith("[EPIC]");
            return (
              <Badge
                key={itemTitle}
                variant="secondary"
                className="text-[11px] font-medium gap-1 bg-muted px-2 py-0.5"
              >
                {isEpic ? (
                  <Layers size={11} className="text-blue-500 shrink-0" />
                ) : (
                  <Ticket size={11} className="text-primary shrink-0" />
                )}
                <span className="truncate max-w-40">{itemTitle}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveMultiItem(itemTitle)}
                  className="hover:text-destructive shrink-0 cursor-pointer ml-0.5"
                >
                  <X size={11} />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Main trigger button */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            "w-full min-h-8 px-2.5 py-1 rounded-md border bg-background text-xs font-normal flex items-center justify-between gap-2 hover:bg-muted/40 transition-colors text-left outline-none focus:ring-1 focus:ring-ring",
            (!value || (isMulti && selectedList.length === 0)) && "text-muted-foreground"
          )}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
            {!isMulti ? (
              <>
                {selectedEpic ? (
                  <Layers size={13} className="text-blue-500 shrink-0" />
                ) : (
                  <Ticket size={13} className="text-primary shrink-0" />
                )}
                <span className="truncate">{displaySingleTitle}</span>
              </>
            ) : (
              <span className="truncate">
                {selectedList.length > 0
                  ? `Añadir más (${selectedList.length} seleccionado${selectedList.length > 1 ? "s" : ""})`
                  : placeholder}
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
            title="Borrar selección"
          >
            <X size={13} />
          </Button>
        )}
      </div>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border bg-popover text-popover-foreground shadow-xl p-2 space-y-2 max-h-64 overflow-hidden flex flex-col">
          {/* Search input inside dropdown */}
          <div className="relative shrink-0">
            <Search size={13} className="absolute left-2.5 top-2.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full h-8 pl-8 pr-2 text-xs bg-muted/50 rounded-md border-0 outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
          </div>

          {/* List of Epics & Tickets */}
          <div className="overflow-y-auto flex-1 space-y-2 pr-1">
            {loading ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Cargando elementos...
              </p>
            ) : filteredEpics.length === 0 && filteredTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No se encontraron tickets ni epics en el board.
              </p>
            ) : (
              <>
                {/* Epics section */}
                {filteredEpics.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-1">
                      <Layers size={10} />
                      <span>EPICS ({filteredEpics.length})</span>
                    </p>
                    {filteredEpics.map((epic) => {
                      const epicFormattedTitle = `[EPIC] ${epic.title}`;
                      const isSelected = isMulti
                        ? selectedList.includes(epicFormattedTitle) || selectedList.includes(epic.title)
                        : value === epicFormattedTitle || value === epic.title || value === epic.id;

                      return (
                        <button
                          key={epic.id}
                          type="button"
                          onClick={() => {
                            if (isMulti) {
                              handleToggleMultiItem(epicFormattedTitle);
                            } else {
                              onSelect(epicFormattedTitle);
                              setOpen(false);
                              setSearch("");
                            }
                          }}
                          className={cn(
                            "w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between gap-2 hover:bg-muted transition-colors cursor-pointer",
                            isSelected && "bg-primary/10 font-medium text-primary"
                          )}
                        >
                          <div className="min-w-0 flex-1 flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: epic.color || "#3b82f6" }}
                            />
                            <span className="truncate font-medium">{epic.title}</span>
                            <span className="text-[9px] px-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded font-semibold shrink-0">
                              EPIC
                            </span>
                          </div>

                          {isSelected && <Check size={14} className="text-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Tickets section */}
                {filteredTasks.length > 0 && (
                  <div className="space-y-1">
                    {allowEpics && filteredEpics.length > 0 && (
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 pt-1 flex items-center gap-1">
                        <Ticket size={10} />
                        <span>Tickets ({filteredTasks.length})</span>
                      </p>
                    )}
                    {filteredTasks.map((t) => {
                      const isSelected = isMulti
                        ? selectedList.includes(t.title) || selectedList.includes(t.id)
                        : value === t.title || value === t.id;
                      const statusTheme = getStatusTheme(t.listTitle);

                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            if (isMulti) {
                              handleToggleMultiItem(t.title);
                            } else {
                              onSelect(t.title);
                              setOpen(false);
                              setSearch("");
                            }
                          }}
                          className={cn(
                            "w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between gap-2 hover:bg-muted transition-colors cursor-pointer",
                            isSelected && "bg-primary/10 font-medium text-primary"
                          )}
                        >
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <p className="truncate font-medium">{t.title}</p>
                            <div className="flex items-center gap-1">
                              <span
                                className={cn("w-1.5 h-1.5 rounded-full", statusTheme.dot)}
                              />
                              <span className="text-[10px] text-muted-foreground">
                                {t.listTitle}
                              </span>
                            </div>
                          </div>

                          {isSelected && <Check size={14} className="text-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
