"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UserCheck,
  Calendar,
  User,
  Users,
  ShieldCheck,
  CheckSquare2,
  MessageSquare,
  Paperclip,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PREDEFINED_STATUSES, getStatusTheme } from "@/lib/statusTheme";
import { AssignedTask, AssignedToMeProps } from "./AssignedToMe.types";

const PRIORITY_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  urgent: {
    label: "Urgente",
    bg: "bg-red-500/10 dark:bg-red-950/30",
    text: "text-red-700 dark:text-red-300",
  },
  high: {
    label: "Alta",
    bg: "bg-orange-500/10 dark:bg-orange-950/30",
    text: "text-orange-700 dark:text-orange-300",
  },
  medium: {
    label: "Media",
    bg: "bg-amber-500/10 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-300",
  },
  low: {
    label: "Baja",
    bg: "bg-emerald-500/10 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-300",
  },
};

function formatDueDate(date: Date | string): {
  label: string;
  variant: "destructive" | "secondary" | "outline";
  isOverdue: boolean;
  isToday: boolean;
} {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(date);
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) {
    return {
      label: `Venció hace ${Math.abs(diffDays)}d`,
      variant: "destructive",
      isOverdue: true,
      isToday: false,
    };
  }
  if (diffDays === 0) {
    return {
      label: "Hoy",
      variant: "outline",
      isOverdue: false,
      isToday: true,
    };
  }
  if (diffDays === 1) {
    return {
      label: "Mañana",
      variant: "secondary",
      isOverdue: false,
      isToday: false,
    };
  }
  return {
    label: due.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    }),
    variant: "secondary",
    isOverdue: false,
    isToday: false,
  };
}

function groupByBoard(tasks: AssignedTask[]) {
  const map = new Map<
    string,
    {
      boardId: string;
      boardTitle: string;
      tasks: AssignedTask[];
    }
  >();

  for (const task of tasks) {
    const { id, title } = task.list.board;
    if (!map.has(id)) {
      map.set(id, { boardId: id, boardTitle: title, tasks: [] });
    }
    map.get(id)!.tasks.push(task);
  }

  return Array.from(map.values());
}

export function AssignedToMe({ tasks: initialTasks, userId }: AssignedToMeProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<AssignedTask[]>(initialTasks);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const getAvailableStatuses = (task: AssignedTask) => {
    const boardLists = task.list.board.list ?? [];
    const existingTitles = new Set(
      boardLists.map((l) => l.title.toLowerCase().trim()),
    );

    const items: {
      id: string;
      title: string;
      active: boolean;
    }[] = [];

    // 1. Board's own configured lists
    for (const list of boardLists) {
      items.push({
        id: list.id,
        title: list.title,
        active:
          task.list.id === list.id ||
          task.list.title.toLowerCase() === list.title.toLowerCase(),
      });
    }

    // 2. Predefined statuses if not already present on this board
    for (const predefined of PREDEFINED_STATUSES) {
      if (!existingTitles.has(predefined.toLowerCase())) {
        items.push({
          id: predefined,
          title: predefined,
          active: task.list.title.toLowerCase() === predefined.toLowerCase(),
        });
      }
    }

    if (items.length === 0) {
      items.push({
        id: task.list.id,
        title: task.list.title,
        active: true,
      });
    }

    return items;
  };

  const handleStatusChange = async (
    task: AssignedTask,
    targetListId?: string,
    targetListTitle?: string,
  ) => {
    const nextTitle =
      targetListTitle ??
      task.list.board.list?.find((l) => l.id === targetListId)?.title;

    if (!nextTitle && !targetListId) return;

    const isDone = /hecho|done|completad|finaliz/i.test(nextTitle ?? "");
    const prevTask = { ...task };

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === task.id) {
          return {
            ...t,
            completed: isDone,
            list: {
              ...t.list,
              id: targetListId ?? t.list.id,
              title: nextTitle ?? t.list.title,
            },
          };
        }
        return t;
      }),
    );

    setUpdatingTaskId(task.id);
    try {
      const res = await fetch(`/api/tasks/updateTask/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listId: targetListId,
          listTitle: targetListTitle,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      toast.success(`Estado cambiado a "${nextTitle}"`);
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? prevTask : t)),
      );
      toast.error("Error al actualizar el estado");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleStatusSelect = (task: AssignedTask, val: string) => {
    const existingList = task.list.board.list?.find(
      (l) => l.id === val || l.title.toLowerCase() === val.toLowerCase(),
    );
    if (existingList) {
      if (existingList.id === task.list.id) return;
      handleStatusChange(task, existingList.id, undefined);
    } else {
      handleStatusChange(task, undefined, val);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Asignado a mí</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-xl border p-4 bg-card">
          <UserCheck size={16} className="shrink-0" />
          <span>No tienes tareas asignadas en ningún board</span>
        </div>
      </div>
    );
  }

  const groups = groupByBoard(tasks);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Asignado a mí</h2>
        <Badge variant="secondary">
          {tasks.length} tarea{tasks.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <div key={group.boardId} className="flex flex-col gap-1.5">
            <Link
              href={`/board/${group.boardId}`}
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-primary transition-colors w-fit"
            >
              {group.boardTitle}
            </Link>
            <div className="flex flex-col gap-1.5">
              {group.tasks.map((task) => {
                const priorityInfo = task.priority
                  ? PRIORITY_CONFIG[task.priority.toLowerCase()]
                  : null;
                const dueInfo = task.dueDate
                  ? formatDueDate(task.dueDate)
                  : null;
                const isAssignee = task.assigneeId === userId;
                const isCollab = task.collaborators?.some(
                  (c) => c.userId === userId,
                );
                const isQa = task.qaId === userId;
                const subtasks = task.subtasks ?? [];
                const subtaskCount = subtasks.length;
                const subtaskDone = subtasks.filter((s) => s.completed).length;
                const commentCount = task._count?.comments ?? 0;
                const attachmentCount = task._count?.attachments ?? 0;
                const statusTheme = getStatusTheme(
                  task.list.title,
                  task.completed,
                );
                const availableStatuses = getAvailableStatuses(task);
                const isUpdating = updatingTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    onClick={() =>
                      router.push(
                        `/board/${task.list.board.id}?taskId=${task.id}`,
                      )
                    }
                    className={cn(
                      "group relative flex items-center justify-between gap-4 px-4 py-3 rounded-xl border bg-card hover:bg-muted/40 hover:border-primary/40 transition-all shadow-xs cursor-pointer select-none text-foreground w-full",
                      task.completed && "opacity-60 bg-muted/20",
                    )}
                  >
                    {/* Left: Title, Priority, Epic, Breadcrumb */}
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            "text-sm font-medium leading-snug break-words group-hover:text-primary transition-colors cursor-pointer",
                            task.completed &&
                              "line-through text-muted-foreground",
                          )}
                        >
                          {task.title}
                        </span>

                        {/* Priority Badge */}
                        {priorityInfo && (
                          <span
                            className={cn(
                              "text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0",
                              priorityInfo.bg,
                              priorityInfo.text,
                            )}
                          >
                            {priorityInfo.label}
                          </span>
                        )}

                        {/* Epic Badge */}
                        {task.epic && (
                          <span
                            className="text-[9px] font-semibold px-1.5 py-0.2 rounded text-white shrink-0"
                            style={{ backgroundColor: task.epic.color }}
                          >
                            {task.epic.title}
                          </span>
                        )}
                      </div>

                      {/* Breadcrumb: Board */}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/board/${task.list.board.id}`);
                          }}
                          className="font-medium hover:text-primary transition-colors underline-offset-2 hover:underline cursor-pointer"
                        >
                          {task.list.board.title}
                        </span>

                        {task.quarter && (
                          <span className="text-[10px] px-1 py-0.2 rounded bg-muted font-medium ml-1">
                            {task.quarter}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Roles, Status Dropdown, Indicators, Due Date */}
                    <div
                      className="flex items-center gap-2.5 shrink-0 ml-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* User Role in this task */}
                      <div className="flex items-center gap-1">
                        {isAssignee && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-5 bg-primary/10 text-primary border-primary/20 gap-1 font-medium"
                          >
                            <User size={10} />
                            Responsable
                          </Badge>
                        )}
                        {isCollab && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 gap-1 font-medium"
                          >
                            <Users size={10} />
                            Colaborador
                          </Badge>
                        )}
                        {isQa && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-5 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 gap-1 font-medium"
                          >
                            <ShieldCheck size={10} />
                            QA
                          </Badge>
                        )}
                      </div>

                      {/* Counters */}
                      <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                        {subtaskCount > 0 && (
                          <span
                            className={cn(
                              "flex items-center gap-1 tabular-nums",
                              subtaskDone === subtaskCount &&
                                "text-emerald-600 dark:text-emerald-400 font-medium",
                            )}
                            title={`${subtaskDone} de ${subtaskCount} subtareas completadas`}
                          >
                            <CheckSquare2 size={12} />
                            <span>
                              {subtaskDone}/{subtaskCount}
                            </span>
                          </span>
                        )}

                        {commentCount > 0 && (
                          <span
                            className="flex items-center gap-1 tabular-nums"
                            title={`${commentCount} comentarios`}
                          >
                            <MessageSquare size={12} />
                            <span>{commentCount}</span>
                          </span>
                        )}

                        {attachmentCount > 0 && (
                          <span
                            className="flex items-center gap-1 tabular-nums"
                            title={`${attachmentCount} archivos adjuntos`}
                          >
                            <Paperclip size={12} />
                            <span>{attachmentCount}</span>
                          </span>
                        )}
                      </div>

                      {/* Due Date */}
                      {dueInfo && (
                        <Badge
                          variant={dueInfo.variant}
                          className={cn(
                            "text-xs gap-1 tabular-nums font-normal",
                            dueInfo.isToday &&
                              !task.completed &&
                              "border-amber-500/30 text-amber-600 dark:text-amber-400 font-medium",
                          )}
                        >
                          <Calendar size={11} />
                          {dueInfo.label}
                        </Badge>
                      )}

                      {/* STATUS SELECT DROPDOWN ON THE RIGHT */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="shrink-0"
                      >
                        <Select
                          value={task.list.id}
                          onValueChange={(val) => {
                            if (val) handleStatusSelect(task, val);
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
                            {isUpdating ? (
                              <Loader2
                                size={11}
                                className="animate-spin shrink-0"
                              />
                            ) : (
                              <span
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full shrink-0",
                                  statusTheme.dot,
                                )}
                              />
                            )}
                            <span className="truncate max-w-[120px]">
                              {task.list.title}
                            </span>
                          </SelectTrigger>
                          <SelectContent align="end" className="w-44">
                            {availableStatuses.map((st) => {
                              const itemTheme = getStatusTheme(st.title);
                              return (
                                <SelectItem
                                  key={st.id || st.title}
                                  value={st.id || st.title}
                                  className="text-xs cursor-pointer py-1.5"
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={cn(
                                        "w-2 h-2 rounded-full shrink-0",
                                        itemTheme.dot,
                                      )}
                                    />
                                    <span className="truncate">{st.title}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
