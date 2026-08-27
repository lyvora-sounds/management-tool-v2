"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertCircle,
  Calendar,
  Search,
  CheckSquare,
  Clock,
  ExternalLink,
  ShieldCheck,
  Users,
  User,
  CheckSquare2,
  MessageSquare,
  Paperclip,
  Layers,
  ArrowUpDown,
  X,
  ChevronDown,
  Check,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BoardListInfo {
  id: string;
  title: string;
  order: number;
}

interface BoardInfo {
  id: string;
  title: string;
  color?: string | null;
  list?: BoardListInfo[];
}

interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  completed: boolean;
  completedAt?: string | null;
  priority?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  quarter?: string | null;
  assigneeId?: string | null;
  qaId?: string | null;
  list: {
    id: string;
    title: string;
    board: BoardInfo;
  };
  labels: { label: { id: string; title: string; color: string } }[];
  subtasks: { id: string; title: string; completed: boolean }[];
  assignee?: { id: string; name: string | null; email: string } | null;
  qa?: { id: string; name: string | null; email: string } | null;
  collaborators: { user: { id: string; name: string | null; email: string } }[];
  epic?: { id: string; title: string; color: string } | null;
  _count?: {
    comments: number;
    attachments: number;
  };
}

interface Props {
  initialTasks: TaskItem[];
  userId: string;
  boards: BoardInfo[];
}

type GroupByOption = "events" | "board" | "role" | "priority";
type RoleFilter = "all" | "assignee" | "collaborator" | "qa";
type StatusFilter = "all" | "pending" | "completed";

export const PREDEFINED_STATUSES = [
  "Por hacer",
  "En progreso",
  "Revisión",
  "Hecho",
] as const;

export function getStatusTheme(title: string, completed?: boolean) {
  const s = (title ?? "").toLowerCase().trim();
  if (
    completed ||
    s.includes("hecho") ||
    s.includes("done") ||
    s.includes("completad") ||
    s.includes("finaliz")
  ) {
    return {
      bg: "bg-emerald-500/10 dark:bg-emerald-950/30",
      text: "text-emerald-700 dark:text-emerald-300",
      border: "border-emerald-500/30 dark:border-emerald-700/40",
      dot: "bg-emerald-500",
      isDone: true,
      label: title,
    };
  }
  if (
    s.includes("progres") ||
    s.includes("curso") ||
    s.includes("doing") ||
    s.includes("desarrollo") ||
    s.includes("progress")
  ) {
    return {
      bg: "bg-blue-500/10 dark:bg-blue-950/30",
      text: "text-blue-700 dark:text-blue-300",
      border: "border-blue-500/30 dark:border-blue-700/40",
      dot: "bg-blue-500",
      isDone: false,
      label: title,
    };
  }
  if (
    s.includes("revis") ||
    s.includes("review") ||
    s.includes("qa") ||
    s.includes("test") ||
    s.includes("evalua")
  ) {
    return {
      bg: "bg-purple-500/10 dark:bg-purple-950/30",
      text: "text-purple-700 dark:text-purple-300",
      border: "border-purple-500/30 dark:border-purple-700/40",
      dot: "bg-purple-500",
      isDone: false,
      label: title,
    };
  }
  if (
    s.includes("hacer") ||
    s.includes("todo") ||
    s.includes("to do") ||
    s.includes("pendient") ||
    s.includes("backlog")
  ) {
    return {
      bg: "bg-slate-500/10 dark:bg-slate-800/40",
      text: "text-slate-700 dark:text-slate-300",
      border: "border-slate-500/25 dark:border-slate-700/40",
      dot: "bg-slate-400 dark:bg-slate-500",
      isDone: false,
      label: title,
    };
  }
  return {
    bg: "bg-zinc-500/10 dark:bg-zinc-800/30",
    text: "text-zinc-700 dark:text-zinc-300",
    border: "border-zinc-500/20 dark:border-zinc-700/30",
    dot: "bg-zinc-400 dark:bg-zinc-500",
    isDone: false,
    label: title,
  };
}

const PRIORITY_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  low: {
    label: "Baja",
    bg: "bg-emerald-500/10 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  medium: {
    label: "Media",
    bg: "bg-amber-500/10 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  high: {
    label: "Alta",
    bg: "bg-orange-500/10 dark:bg-orange-950/30",
    text: "text-orange-700 dark:text-orange-300",
    dot: "bg-orange-500",
  },
  urgent: {
    label: "Urgente",
    bg: "bg-rose-500/10 dark:bg-rose-950/30",
    text: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
  },
};

function formatDueDate(dueDateStr: string): { label: string; isOverdue: boolean; isToday: boolean; isSoon: boolean } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(dueDateStr);
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) {
    return {
      label: `Venció hace ${Math.abs(diffDays)}d`,
      isOverdue: true,
      isToday: false,
      isSoon: false,
    };
  }
  if (diffDays === 0) {
    return {
      label: "Hoy",
      isOverdue: false,
      isToday: true,
      isSoon: false,
    };
  }
  if (diffDays === 1) {
    return {
      label: "Mañana",
      isOverdue: false,
      isToday: false,
      isSoon: true,
    };
  }
  if (diffDays <= 7) {
    return {
      label: `En ${diffDays} días`,
      isOverdue: false,
      isToday: false,
      isSoon: true,
    };
  }

  return {
    label: due.toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
    isOverdue: false,
    isToday: false,
    isSoon: false,
  };
}

export function MyTasksView({ initialTasks, userId, boards }: Props) {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [search, setSearch] = useState("");
  const [boardFilter, setBoardFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [groupBy, setGroupBy] = useState<GroupByOption>("events");

  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  // Status Change Handler
  const handleStatusChange = async (
    task: TaskItem,
    targetListId?: string,
    targetListTitle?: string,
  ) => {
    const nextTitle =
      targetListTitle ??
      boards
        .find((b) => b.id === task.list.board.id)
        ?.list?.find((l) => l.id === targetListId)?.title;

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
            completedAt: isDone ? new Date().toISOString() : null,
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

      const updated = await res.json();
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, ...updated } : t)),
      );
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

  const getAvailableStatuses = (task: TaskItem) => {
    const board = boards.find((b) => b.id === task.list.board.id);
    const boardLists = board?.list ?? [];

    const existingTitles = new Set(
      boardLists.map((l) => l.title.toLowerCase().trim()),
    );

    const items: {
      id?: string;
      title: string;
      isPredefined?: boolean;
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
          title: predefined,
          isPredefined: true,
          active: task.list.title.toLowerCase() === predefined.toLowerCase(),
        });
      }
    }

    return items;
  };

  // Metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;

    let overdue = 0;
    let dueToday = 0;

    for (const t of tasks) {
      if (t.completed || !t.dueDate) continue;
      const due = new Date(t.dueDate);
      const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      if (dueDay < today) overdue++;
      else if (dueDay.getTime() === today.getTime()) dueToday++;
    }

    return { total, pending, completed, overdue, dueToday };
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Status
      if (statusFilter === "pending" && task.completed) return false;
      if (statusFilter === "completed" && !task.completed) return false;

      // Board
      if (boardFilter !== "all" && task.list.board.id !== boardFilter) return false;

      // Priority
      if (priorityFilter !== "all" && (task.priority ?? "none") !== priorityFilter)
        return false;

      // Role
      if (roleFilter === "assignee" && task.assigneeId !== userId) return false;
      if (
        roleFilter === "collaborator" &&
        !task.collaborators.some((c) => c.user.id === userId)
      )
        return false;
      if (roleFilter === "qa" && task.qaId !== userId) return false;

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesBoard = task.list.board.title.toLowerCase().includes(q);
        const matchesList = task.list.title.toLowerCase().includes(q);
        if (!matchesTitle && !matchesBoard && !matchesList) return false;
      }

      return true;
    });
  }, [tasks, search, boardFilter, roleFilter, priorityFilter, statusFilter, userId]);

  // Grouping
  const groupedSections = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);

    if (groupBy === "events") {
      const overdue: TaskItem[] = [];
      const forToday: TaskItem[] = [];
      const thisWeek: TaskItem[] = [];
      const upcoming: TaskItem[] = [];
      const noDate: TaskItem[] = [];
      const done: TaskItem[] = [];

      for (const t of filteredTasks) {
        if (t.completed) {
          done.push(t);
          continue;
        }
        if (!t.dueDate) {
          noDate.push(t);
          continue;
        }
        const due = new Date(t.dueDate);
        const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

        if (dueDay < today) overdue.push(t);
        else if (dueDay.getTime() === today.getTime()) forToday.push(t);
        else if (dueDay <= weekEnd) thisWeek.push(t);
        else upcoming.push(t);
      }

      const sections = [];
      if (overdue.length > 0)
        sections.push({
          id: "overdue",
          title: "Vencidas",
          icon: <AlertCircle size={15} className="text-rose-500" />,
          badgeVariant: "destructive" as const,
          tasks: overdue,
        });
      if (forToday.length > 0)
        sections.push({
          id: "today",
          title: "Para Hoy",
          icon: <Clock size={15} className="text-amber-500" />,
          badgeVariant: "secondary" as const,
          tasks: forToday,
        });
      if (thisWeek.length > 0)
        sections.push({
          id: "week",
          title: "Esta semana",
          icon: <Calendar size={15} className="text-blue-500" />,
          badgeVariant: "outline" as const,
          tasks: thisWeek,
        });
      if (upcoming.length > 0)
        sections.push({
          id: "upcoming",
          title: "Próximas",
          icon: <Calendar size={15} className="text-muted-foreground" />,
          badgeVariant: "outline" as const,
          tasks: upcoming,
        });
      if (noDate.length > 0)
        sections.push({
          id: "nodate",
          title: "Sin fecha asignada",
          icon: <CheckSquare size={15} className="text-muted-foreground" />,
          badgeVariant: "outline" as const,
          tasks: noDate,
        });
      if (done.length > 0)
        sections.push({
          id: "done",
          title: "Completadas",
          icon: <CheckCircle2 size={15} className="text-emerald-500" />,
          badgeVariant: "secondary" as const,
          tasks: done,
        });

      return sections;
    }

    if (groupBy === "board") {
      const map = new Map<string, { title: string; color?: string | null; tasks: TaskItem[] }>();
      for (const t of filteredTasks) {
        const b = t.list.board;
        if (!map.has(b.id)) {
          map.set(b.id, { title: b.title, color: b.color, tasks: [] });
        }
        map.get(b.id)!.tasks.push(t);
      }
      return Array.from(map.entries()).map(([id, val]) => ({
        id,
        title: val.title,
        icon: <Layers size={15} className="text-primary" />,
        badgeVariant: "outline" as const,
        tasks: val.tasks,
      }));
    }

    if (groupBy === "role") {
      const assigneeTasks: TaskItem[] = [];
      const collabTasks: TaskItem[] = [];
      const qaTasks: TaskItem[] = [];

      for (const t of filteredTasks) {
        if (t.assigneeId === userId) assigneeTasks.push(t);
        else if (t.collaborators.some((c) => c.user.id === userId)) collabTasks.push(t);
        else if (t.qaId === userId) qaTasks.push(t);
      }

      const sections = [];
      if (assigneeTasks.length > 0)
        sections.push({
          id: "role-assignee",
          title: "Soy Responsable (Asignado)",
          icon: <User size={15} className="text-primary" />,
          badgeVariant: "secondary" as const,
          tasks: assigneeTasks,
        });
      if (collabTasks.length > 0)
        sections.push({
          id: "role-collab",
          title: "Soy Colaborador",
          icon: <Users size={15} className="text-blue-500" />,
          badgeVariant: "outline" as const,
          tasks: collabTasks,
        });
      if (qaTasks.length > 0)
        sections.push({
          id: "role-qa",
          title: "Soy Revisor de QA",
          icon: <ShieldCheck size={15} className="text-emerald-500" />,
          badgeVariant: "outline" as const,
          tasks: qaTasks,
        });
      return sections;
    }

    if (groupBy === "priority") {
      const priorityKeys = ["urgent", "high", "medium", "low", "none"];
      const sections = [];
      for (const key of priorityKeys) {
        const groupTasks = filteredTasks.filter(
          (t) => (t.priority ?? "none") === key,
        );
        if (groupTasks.length > 0) {
          const cfg = PRIORITY_CONFIG[key] ?? {
            label: "Sin prioridad",
            bg: "bg-muted",
            text: "text-muted-foreground",
            dot: "bg-muted-foreground",
          };
          sections.push({
            id: key,
            title: cfg.label,
            icon: <span className={cn("w-2.5 h-2.5 rounded-full", cfg.dot)} />,
            badgeVariant: "outline" as const,
            tasks: groupTasks,
          });
        }
      }
      return sections;
    }

    return [];
  }, [filteredTasks, groupBy, userId]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mis tasks</h1>
          <p className="text-sm text-muted-foreground">
            Todas tus tareas asignadas, colaboraciones y revisiones de QA en un solo lugar.
          </p>
        </div>

        {/* Quick Metrics Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter("all")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-card text-xs transition-all cursor-pointer",
              statusFilter === "all" && "ring-2 ring-primary border-primary/50"
            )}
          >
            <span className="text-muted-foreground">Total:</span>
            <span className="font-bold">{metrics.total}</span>
          </button>

          <button
            onClick={() => setStatusFilter("pending")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-card text-xs transition-all cursor-pointer",
              statusFilter === "pending" && "ring-2 ring-primary border-primary/50"
            )}
          >
            <span className="text-muted-foreground">Pendientes:</span>
            <span className="font-bold">{metrics.pending}</span>
          </button>

          {metrics.overdue > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-medium">
              <AlertCircle size={13} />
              <span>{metrics.overdue} vencidas</span>
            </div>
          )}

          {metrics.dueToday > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium">
              <Clock size={13} />
              <span>{metrics.dueToday} hoy</span>
            </div>
          )}

          <button
            onClick={() => setStatusFilter("completed")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-card text-xs transition-all cursor-pointer",
              statusFilter === "completed" && "ring-2 ring-primary border-primary/50"
            )}
          >
            <span className="text-muted-foreground">Completadas:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.completed}
            </span>
          </button>
        </div>
      </div>

      {/* Filter and Grouping Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between bg-card p-3 rounded-2xl border shadow-xs">
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-60">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Buscar tareas o tableros..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs bg-background"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Board Filter */}
          {boards.length > 0 && (
            <Select value={boardFilter} onValueChange={(val) => setBoardFilter(val ?? "all")}>
              <SelectTrigger className="h-8 text-xs w-auto min-w-32 bg-background">
                <SelectValue placeholder="Tablero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  Todos los tableros
                </SelectItem>
                {boards.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="text-xs">
                    {b.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Role Filter */}
          <Select
            value={roleFilter}
            onValueChange={(val) => setRoleFilter((val ?? "all") as RoleFilter)}
          >
            <SelectTrigger className="h-8 text-xs w-auto min-w-32 bg-background">
              <SelectValue placeholder="Mi Rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                Todos los roles
              </SelectItem>
              <SelectItem value="assignee" className="text-xs">
                Responsable (Asignado)
              </SelectItem>
              <SelectItem value="collaborator" className="text-xs">
                Colaborador
              </SelectItem>
              <SelectItem value="qa" className="text-xs">
                QA
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select value={priorityFilter} onValueChange={(val) => setPriorityFilter(val ?? "all")}>
            <SelectTrigger className="h-8 text-xs w-auto min-w-28 bg-background">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                Todas las prioridades
              </SelectItem>
              <SelectItem value="urgent" className="text-xs">
                Urgente
              </SelectItem>
              <SelectItem value="high" className="text-xs">
                Alta
              </SelectItem>
              <SelectItem value="medium" className="text-xs">
                Media
              </SelectItem>
              <SelectItem value="low" className="text-xs">
                Baja
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <ToggleGroup
            value={[statusFilter]}
            onValueChange={(val: string[]) => {
              const next = val.find((v) => v !== statusFilter) ?? statusFilter;
              setStatusFilter(next as StatusFilter);
            }}
            className="border rounded-lg bg-background p-0.5"
          >
            <ToggleGroupItem value="all" className="text-xs h-7 px-2.5">
              Todas
            </ToggleGroupItem>
            <ToggleGroupItem value="pending" className="text-xs h-7 px-2.5">
              Pendientes
            </ToggleGroupItem>
            <ToggleGroupItem value="completed" className="text-xs h-7 px-2.5">
              Completadas
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Group By Selector */}
        <div className="flex items-center gap-1.5 self-end lg:self-auto shrink-0">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <ArrowUpDown size={12} /> Agrupar:
          </span>
          <ToggleGroup
            value={[groupBy]}
            onValueChange={(val: string[]) => {
              const next = val.find((v) => v !== groupBy) ?? groupBy;
              setGroupBy(next as GroupByOption);
            }}
            className="border rounded-lg bg-background p-0.5"
          >
            <ToggleGroupItem value="events" className="text-xs h-7 px-2" title="Por Fecha / Eventos">
              Eventos
            </ToggleGroupItem>
            <ToggleGroupItem value="board" className="text-xs h-7 px-2" title="Por Tablero">
              Tablero
            </ToggleGroupItem>
            <ToggleGroupItem value="role" className="text-xs h-7 px-2" title="Por Rol">
              Rol
            </ToggleGroupItem>
            <ToggleGroupItem value="priority" className="text-xs h-7 px-2" title="Por Prioridad">
              Prioridad
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Task List Sections */}
      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed bg-card/50">
          <CheckCircle2 className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <h3 className="text-base font-semibold">No se encontraron tareas</h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1">
            {tasks.length === 0
              ? "Aún no tienes tareas asignadas en ningún tablero."
              : "No hay tareas que coincidan con los filtros seleccionados."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groupedSections.map((section) => (
            <div key={section.id} className="flex flex-col gap-2.5">
              {/* Section Header */}
              <div className="flex items-center gap-2 px-1">
                {section.icon}
                <h3 className="text-sm font-semibold tracking-tight">{section.title}</h3>
                <Badge variant={section.badgeVariant} className="text-[10px] h-5 px-1.5">
                  {section.tasks.length}
                </Badge>
              </div>

              {/* Tasks in Section */}
              <div className="flex flex-col gap-1.5">
                {section.tasks.map((task) => {
                  const isAssignee = task.assigneeId === userId;
                  const isCollab = task.collaborators.some(
                    (c) => c.user.id === userId,
                  );
                  const isQa = task.qaId === userId;

                  const priorityInfo = task.priority
                    ? PRIORITY_CONFIG[task.priority]
                    : null;
                  const dueInfo = task.dueDate
                    ? formatDueDate(task.dueDate)
                    : null;
                  const subtaskCount = task.subtasks.length;
                  const subtaskDone = task.subtasks.filter(
                    (s) => s.completed,
                  ).length;
                  const statusTheme = getStatusTheme(
                    task.list.title,
                    task.completed,
                  );
                  const availableStatuses = getAvailableStatuses(task);
                  const isUpdating = updatingTaskId === task.id;

                  return (
                    <Link
                      key={task.id}
                      href={`/board/${task.list.board.id}?taskId=${task.id}`}
                      className={cn(
                        "group relative flex items-center justify-between gap-4 px-4 py-3 rounded-xl border bg-card hover:bg-muted/40 hover:border-primary/40 transition-all shadow-xs cursor-pointer no-underline text-foreground w-full",
                        task.completed && "opacity-60 bg-muted/20",
                      )}
                    >
                      {/* Left: Title, Priority, Epic, Breadcrumb */}
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={cn(
                              "text-sm font-medium leading-snug break-words group-hover:text-primary transition-colors",
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
                              e.preventDefault();
                              e.stopPropagation();
                              window.location.href = `/board/${task.list.board.id}`;
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

                      {/* Right: Roles, Status Dropdown, Indicators, Due Date & Direct Link */}
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
                              variant="outline"
                              className="text-[10px] h-5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 gap-1 font-medium"
                            >
                              <Users size={10} />
                              Colaborador
                            </Badge>
                          )}
                          {isQa && (
                            <Badge
                              variant="outline"
                              className="text-[10px] h-5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1 font-medium"
                            >
                              <ShieldCheck size={10} />
                              QA
                            </Badge>
                          )}
                        </div>

                        {/* Subtasks indicator */}
                        {subtaskCount > 0 && (
                          <span
                            className={cn(
                              "flex items-center gap-1 text-[11px]",
                              subtaskDone === subtaskCount
                                ? "text-primary font-medium"
                                : "text-muted-foreground",
                            )}
                            title={`Subtareas: ${subtaskDone}/${subtaskCount}`}
                          >
                            <CheckSquare2 size={12} />
                            {subtaskDone}/{subtaskCount}
                          </span>
                        )}

                        {/* Comments count */}
                        {(task._count?.comments ?? 0) > 0 && (
                          <span
                            className="flex items-center gap-1 text-[11px] text-muted-foreground"
                            title="Comentarios"
                          >
                            <MessageSquare size={12} />
                            {task._count?.comments}
                          </span>
                        )}

                        {/* Attachments count */}
                        {(task._count?.attachments ?? 0) > 0 && (
                          <span
                            className="flex items-center gap-1 text-[11px] text-muted-foreground"
                            title="Adjuntos"
                          >
                            <Paperclip size={12} />
                            {task._count?.attachments}
                          </span>
                        )}

                        {/* Due Date badge */}
                        {dueInfo && (
                          <Badge
                            variant={
                              dueInfo.isOverdue && !task.completed
                                ? "destructive"
                                : dueInfo.isToday && !task.completed
                                  ? "secondary"
                                  : "outline"
                            }
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

                        {/* STATUS DROPDOWN TAG ON THE RIGHT */}
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            className={cn(
                              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer select-none",
                              "hover:ring-2 hover:ring-primary/20 hover:opacity-90 shadow-2xs shrink-0",
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
                            <ChevronDown
                              size={11}
                              className="opacity-60 shrink-0 ml-0.5"
                            />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenuLabel className="text-[11px] text-muted-foreground px-2 py-1 font-semibold uppercase tracking-wider">
                              Estado del ticket
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {availableStatuses.map((st) => {
                              const itemTheme = getStatusTheme(st.title);
                              return (
                                <DropdownMenuItem
                                  key={st.id || st.title}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleStatusChange(
                                      task,
                                      st.id,
                                      st.isPredefined ? st.title : undefined,
                                    );
                                  }}
                                  className="flex items-center justify-between text-xs py-1.5 px-2 cursor-pointer"
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <span
                                      className={cn(
                                        "w-2 h-2 rounded-full shrink-0",
                                        itemTheme.dot,
                                      )}
                                    />
                                    <span className="truncate">{st.title}</span>
                                  </div>
                                  {st.active && (
                                    <Check
                                      size={13}
                                      className="text-primary shrink-0 ml-2"
                                    />
                                  )}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Direct link to Board */}
                        <span
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.location.href = `/board/${task.list.board.id}?taskId=${task.id}`;
                          }}
                          className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                          title="Abrir ticket en el tablero"
                        >
                          <ExternalLink size={14} />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
