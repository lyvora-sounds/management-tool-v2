"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, LayoutDashboard, CheckCircle2, Circle, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SearchResults } from "./GlobalSearch.types";
import { SearchResultsSkeleton } from "@/components/skeletons";

const DEBOUNCE_MS = 300;

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({
    boards: [],
    tasks: [],
  });
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
      setQuery("");
      setResults({ boards: [], tasks: [] });
      setActiveIndex(0);
    }
  }, [open]);

  const search = useCallback((q: string) => {
    if (q.length < 2) {
      setResults({ boards: [], tasks: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => {
        setResults(data);
        setActiveIndex(0);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), DEBOUNCE_MS);
  };

  // Flatten all items for keyboard nav
  const allItems = [
    ...results.boards.map((b) => ({ type: "board" as const, item: b })),
    ...results.tasks.map((t) => ({ type: "task" as const, item: t })),
  ];

  const navigate = (index: number) => {
    const entry = allItems[index];
    if (!entry) return;
    setOpen(false);
    if (entry.type === "board") {
      router.push(`/board/${entry.item.id}`);
    } else {
      router.push(`/board/${entry.item.list.boardId}?taskId=${entry.item.id}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      navigate(activeIndex);
    }
  };

  const hasResults = results.boards.length > 0 || results.tasks.length > 0;
  let itemCounter = 0;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-8 px-15 rounded-full border-muted-foreground/20 bg-muted/50 text-sm text-muted-foreground hover:bg-muted transition-colors"
      >
        <Search size={14} />
        <span>Buscar...</span>
        <Kbd className="ml-2 text-xs border rounded px-1 py-0.5 bg-background hidden sm:block">
          ⌘K
        </Kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-3 border-b">
            <Search size={16} className="text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar boards y tareas..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {/* {query && (
              <button
                onClick={() => handleChange("")}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )} */}
          </div>

          {/* Results */}
          <div className="overflow-y-auto max-h-[60vh] flex flex-col py-1">
            {loading && <SearchResultsSkeleton count={4} />}

            {!loading && query.length >= 2 && !hasResults && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Sin resultados para &quot;{query}&quot;
              </p>
            )}

            {!loading && query.length < 2 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Escribe al menos 2 caracteres
              </p>
            )}

            {!loading && results.boards.length > 0 && (
              <div className="flex flex-col">
                <p className="text-xs font-medium text-muted-foreground px-3 py-1.5">
                  Boards
                </p>
                {results.boards.map((board) => {
                  const idx = itemCounter++;
                  return (
                    <button
                      key={board.id}
                      onClick={() => navigate(idx)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
                        activeIndex === idx ? "bg-muted" : "hover:bg-muted/50",
                      )}
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: board.color ?? "#6366f1" }}
                      />
                      <LayoutDashboard
                        size={14}
                        className="text-muted-foreground shrink-0"
                      />
                      <span className="text-sm truncate">{board.title}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {!loading && results.tasks.length > 0 && (
              <div className="flex flex-col">
                <p className="text-xs font-medium text-muted-foreground px-3 py-1.5 mt-1">
                  Tareas
                </p>
                {results.tasks.map((task) => {
                  const idx = itemCounter++;
                  return (
                    <button
                      key={task.id}
                      onClick={() => navigate(idx)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
                        activeIndex === idx ? "bg-muted" : "hover:bg-muted/50",
                      )}
                    >
                      {task.completed ? (
                        <CheckCircle2
                          size={14}
                          className="text-primary shrink-0"
                        />
                      ) : (
                        <Circle
                          size={14}
                          className="text-muted-foreground shrink-0"
                        />
                      )}
                      <div className="flex flex-col min-w-0">
                        <span
                          className={cn(
                            "text-sm truncate",
                            task.completed &&
                              "line-through text-muted-foreground",
                          )}
                        >
                          {task.title}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {task.list.board.title} · {task.list.title}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer hint */}
          {hasResults && (
            <div className="border-t px-3 py-2 flex items-center gap-3 text-xs text-muted-foreground">
              <KbdGroup>
                <Kbd className="border rounded px-1">↑↓</Kbd> navegar
                <Kbd className="border rounded px-1">↵</Kbd> ir
                <Kbd className="border rounded px-1">Esc</Kbd> cerrar
              </KbdGroup>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
