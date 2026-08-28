"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  Layers,
  ArrowUpDown,
  X,
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { isDoneList } from "@/lib/statusTheme";
import { PRIORITY_CONFIG } from "@/lib/taskDisplay";
import { DashboardTaskRow } from "../../components/DashboardTaskRow/DashboardTaskRow";

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
  completedAt?: Date | string | null;
  priority?: string | null;
  startDate?: Date | string | null;
  dueDate?: Date | string | null;
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

export function MyTasksView({ initialTasks, userId, boards }: Props) {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [search, setSearch] = useState("");
  const [boardFilter, setBoardFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [groupBy, setGroupBy] = useState<GroupByOption>("events");

  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const handleStatusChange = async (task: TaskItem, targetListId: string) => {
    const nextTitle = boards
      .find((b) => b.id === task.list.board.id)
      ?.list?.find((l) => l.id === targetListId)?.title;
    if (!nextTitle || targetListId === task.list.id) return;

    const done = isDoneList(nextTitle);
    const prevTask = { ...task };

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              completed: done,
              completedAt: done ? new Date().toISOString() : null,
              list: { ...t.list, id: targetListId, title: nextTitle },
            }
          : t,
      ),
    );

    setUpdatingTaskId(task.id);
    try {
      const res = await fetch(`/api/tasks/updateTask/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId: targetListId }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const updated = await res.json();
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, ...updated } : t)),
      );
      toast.success(`Estado cambiado a "${nextTitle}"`);
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? prevTask : t)));
      toast.error("Error al actualizar el estado");
    } finally {
      setUpdatingTaskId(null);
    }
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
                {section.tasks.map((task) => (
                  <DashboardTaskRow
                    key={task.id}
                    task={task}
                    isAssignee={task.assigneeId === userId}
                    isCollab={task.collaborators.some((c) => c.user.id === userId)}
                    isQa={task.qaId === userId}
                    lists={
                      boards.find((b) => b.id === task.list.board.id)?.list ?? []
                    }
                    updating={updatingTaskId === task.id}
                    onOpen={() =>
                      router.push(`/board/${task.list.board.id}?taskId=${task.id}`)
                    }
                    onOpenBoard={() => router.push(`/board/${task.list.board.id}`)}
                    onStatusChange={(listId) => handleStatusChange(task, listId)}
                    trailing={
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            `/board/${task.list.board.id}?taskId=${task.id}`,
                          );
                        }}
                        className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                        title="Abrir ticket en el tablero"
                      >
                        <ExternalLink size={14} />
                      </button>
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
