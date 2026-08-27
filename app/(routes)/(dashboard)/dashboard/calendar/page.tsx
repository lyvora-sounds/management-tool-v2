"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CalendarTask } from "./calendar.types";
import { WEEKDAYS, MONTHS } from "./calendar.constants";

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toLocalDate(iso: string) {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Build grid of days for the month (Mon-first, 6 rows)
function buildGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Monday=0 offset
  const startOffset = (firstDay.getDay() + 6) % 7;
  const grid: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) grid.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++)
    grid.push(new Date(year, month, d));
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

export default function CalendarPage() {
  const router = useRouter();
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Date | null>(null);

  const fetchTasks = useCallback((y: number, m: number) => {
    setLoading(true);
    fetch(`/api/calendar?year=${y}&month=${m + 1}`)
      .then((r) => r.json())
      .then((data) => setTasks(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchTasks(year, month), 0);
    return () => clearTimeout(t);
  }, [year, month, fetchTasks]);

  const prevMonth = () => {
    setSelected(null);
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    setSelected(null);
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
  };

  const tasksByDay = tasks.reduce<Record<string, CalendarTask[]>>(
    (acc, task) => {
      const key = toLocalDate(task.dueDate).toDateString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(task);
      return acc;
    },
    {},
  );

  const selectedDayTasks = selected
    ? (tasksByDay[selected.toDateString()] ?? [])
    : [];
  const grid = buildGrid(year, month);
  const daysWithTasksCount = Object.keys(tasksByDay).length;

  return (
    <div className="flex flex-col h-full p-3 sm:p-6 gap-4 sm:gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendario</h1>
        {loading && (
          <span className="text-sm text-muted-foreground">Cargando...</span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 flex-1 min-h-0">
        {/* Calendar grid  */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {/* Month nav */}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft size={16} />
            </Button>
            <span className="text-base font-semibold">
              {MONTHS[month]} {year}
            </span>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight size={16} />
            </Button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="text-xs font-medium text-muted-foreground py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1 flex-1">
            {grid.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} />;

              const key = date.toDateString();
              const dayTasks = tasksByDay[key] ?? [];
              const isToday = isSameDay(date, today);
              const isSelected = selected ? isSameDay(date, selected) : false;
              const pending = dayTasks.filter((t) => !t.completed).length;
              const done = dayTasks.filter((t) => t.completed).length;

              return (
                <button
                  key={key}
                  onClick={() => setSelected(isSelected ? null : date)}
                  className={cn(
                    "flex flex-col items-center rounded-lg border p-1 sm:p-1.5 min-h-10 sm:min-h-16 transition-colors text-left",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : isToday
                        ? "bg-muted border-primary/50"
                        : "hover:bg-muted border-transparent hover:border-border",
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                      isToday &&
                        !isSelected &&
                        "bg-primary text-primary-foreground",
                    )}
                  >
                    {date.getDate()}
                  </span>

                  {dayTasks.length > 0 && (
                    <div className="flex flex-col gap-0.5 w-full mt-1">
                      {/* Móvil: solo punto indicador */}
                      <span className={cn(
                        "sm:hidden w-1.5 h-1.5 rounded-full mx-auto shrink-0",
                        isSelected ? "bg-primary-foreground" : "bg-primary",
                      )} />
                      {pending > 0 && (
                        <span
                          className={cn(
                            "hidden sm:block text-[10px] leading-none px-1 py-0.5 rounded font-medium",
                            isSelected
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-primary/10 text-primary",
                          )}
                        >
                          {pending} pendiente{pending !== 1 ? "s" : ""}
                        </span>
                      )}
                      {done > 0 && (
                        <span
                          className={cn(
                            "hidden sm:block text-[10px] leading-none px-1 py-0.5 rounded",
                            isSelected
                              ? "bg-primary-foreground/10 text-primary-foreground/70"
                              : "bg-muted-foreground/10 text-muted-foreground",
                          )}
                        >
                          {done} hecha{done !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <Separator className="sm:hidden" />
        <Separator orientation="vertical" className="hidden sm:block" />
        {/* Day detail panel */}
        <div className="sm:w-72 sm:shrink-0 flex flex-col gap-3">
          {selected ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold capitalize">
                  {selected.toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </h2>
                <Badge variant="secondary">{selectedDayTasks.length}</Badge>
              </div>

              {selectedDayTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sin tareas para este día
                </p>
              ) : (
                <div className="flex flex-col gap-2 overflow-y-auto">
                  {selectedDayTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-2 rounded-lg border p-2.5 bg-background"
                    >
                      {task.completed ? (
                        <CheckCircle2
                          size={15}
                          className="text-primary shrink-0 mt-0.5"
                        />
                      ) : (
                        <Circle
                          size={15}
                          className="text-muted-foreground shrink-0 mt-0.5"
                        />
                      )}
                      <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                        <span
                          className={cn(
                            "text-sm leading-snug",
                            task.completed &&
                              "line-through text-muted-foreground",
                          )}
                        >
                          {task.title}
                        </span>
                        <div className="flex items-center gap-1">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                task.list.board.color ?? "#6366f1",
                            }}
                          />
                          <span className="text-xs text-muted-foreground truncate">
                            {task.list.board.title} · {task.list.title}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-6 w-6"
                        onClick={() =>
                          router.push(`/board/${task.list.board.id}?taskId=${task.id}`)
                        }
                      >
                        <ExternalLink size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center gap-2 text-muted-foreground">
              <p className="text-sm">Selecciona un día para ver sus tareas</p>
              {daysWithTasksCount > 0 && (
                <p className="text-xs">
                  {daysWithTasksCount} días con tareas este mes
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
