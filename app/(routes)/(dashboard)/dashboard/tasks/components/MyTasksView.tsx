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
import { useTranslations } from "next-intl";
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
type PriorityKey = "urgent" | "high" | "medium" | "low" | "none";

export function MyTasksView({ initialTasks, userId, boards }: Props) {
  const t = useTranslations("myTasks");
  const tPriority = useTranslations("priority");
  const tFilters = useTranslations("filters");
  const tDash = useTranslations("dashboard");
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
      prev.map((item) =>
        item.id === task.id
          ? {
              ...item,
              completed: done,
              completedAt: done ? new Date().toISOString() : null,
              list: { ...item.list, id: targetListId, title: nextTitle },
            }
          : item,
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
        prev.map((item) => (item.id === task.id ? { ...item, ...updated } : item)),
      );
      toast.success(tDash("statusChanged", { title: nextTitle }));
    } catch {
      setTasks((prev) => prev.map((item) => (item.id === task.id ? prevTask : item)));
      toast.error(tDash("statusUpdateError"));
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const total = tasks.length;
    const completed = tasks.filter((item) => item.completed).length;
    const pending = total - completed;

    let overdue = 0;
    let dueToday = 0;

    for (const item of tasks) {
      if (item.completed || !item.dueDate) continue;
      const due = new Date(item.dueDate);
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

      for (const item of filteredTasks) {
        if (item.completed) {
          done.push(item);
          continue;
        }
        if (!item.dueDate) {
          noDate.push(item);
          continue;
        }
        const due = new Date(item.dueDate);
        const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

        if (dueDay < today) overdue.push(item);
        else if (dueDay.getTime() === today.getTime()) forToday.push(item);
        else if (dueDay <= weekEnd) thisWeek.push(item);
        else upcoming.push(item);
      }

      const sections = [];
      if (overdue.length > 0)
        sections.push({
          id: "overdue",
          title: tFilters("overdue"),
          icon: <AlertCircle size={15} className="text-rose-500" />,
          badgeVariant: "destructive" as const,
          tasks: overdue,
        });
      if (forToday.length > 0)
        sections.push({
          id: "today",
          title: tFilters("today"),
          icon: <Clock size={15} className="text-amber-500" />,
          badgeVariant: "secondary" as const,
          tasks: forToday,
        });
      if (thisWeek.length > 0)
        sections.push({
          id: "week",
          title: tFilters("thisWeek"),
          icon: <Calendar size={15} className="text-blue-500" />,
          badgeVariant: "outline" as const,
          tasks: thisWeek,
        });
      if (upcoming.length > 0)
        sections.push({
          id: "upcoming",
          title: t("upcoming"),
          icon: <Calendar size={15} className="text-muted-foreground" />,
          badgeVariant: "outline" as const,
          tasks: upcoming,
        });
      if (noDate.length > 0)
        sections.push({
          id: "nodate",
          title: tFilters("noDate"),
          icon: <CheckSquare size={15} className="text-muted-foreground" />,
          badgeVariant: "outline" as const,
          tasks: noDate,
        });
      if (done.length > 0)
        sections.push({
          id: "done",
          title: tFilters("completed"),
          icon: <CheckCircle2 size={15} className="text-emerald-500" />,
          badgeVariant: "secondary" as const,
          tasks: done,
        });

      return sections;
    }

    if (groupBy === "board") {
      const map = new Map<string, { title: string; color?: string | null; tasks: TaskItem[] }>();
      for (const item of filteredTasks) {
        const b = item.list.board;
        if (!map.has(b.id)) {
          map.set(b.id, { title: b.title, color: b.color, tasks: [] });
        }
        map.get(b.id)!.tasks.push(item);
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

      for (const item of filteredTasks) {
        if (item.assigneeId === userId) assigneeTasks.push(item);
        else if (item.collaborators.some((c) => c.user.id === userId)) collabTasks.push(item);
        else if (item.qaId === userId) qaTasks.push(item);
      }

      const sections = [];
      if (assigneeTasks.length > 0)
        sections.push({
          id: "role-assignee",
          title: t("roleAssigneeTitle"),
          icon: <User size={15} className="text-primary" />,
          badgeVariant: "secondary" as const,
          tasks: assigneeTasks,
        });
      if (collabTasks.length > 0)
        sections.push({
          id: "role-collab",
          title: t("roleCollaboratorTitle"),
          icon: <Users size={15} className="text-blue-500" />,
          badgeVariant: "outline" as const,
          tasks: collabTasks,
        });
      if (qaTasks.length > 0)
        sections.push({
          id: "role-qa",
          title: t("roleQaTitle"),
          icon: <ShieldCheck size={15} className="text-emerald-500" />,
          badgeVariant: "outline" as const,
          tasks: qaTasks,
        });
      return sections;
    }

    if (groupBy === "priority") {
      const priorityKeys: PriorityKey[] = ["urgent", "high", "medium", "low", "none"];
      const sections = [];
      for (const key of priorityKeys) {
        const groupTasks = filteredTasks.filter(
          (item) => (item.priority ?? "none") === key,
        );
        if (groupTasks.length > 0) {
          const cfg = PRIORITY_CONFIG[key] ?? {
            label: tPriority("none"),
            bg: "bg-muted",
            text: "text-muted-foreground",
            dot: "bg-muted-foreground",
          };
          sections.push({
            id: key,
            title: tPriority(key),
            icon: <span className={cn("w-2.5 h-2.5 rounded-full", cfg.dot)} />,
            badgeVariant: "outline" as const,
            tasks: groupTasks,
          });
        }
      }
      return sections;
    }

    return [];
  }, [filteredTasks, groupBy, userId, t, tFilters, tPriority]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("subtitle")}
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
            <span className="text-muted-foreground">{t("total")}</span>
            <span className="font-bold">{metrics.total}</span>
          </button>

          <button
            onClick={() => setStatusFilter("pending")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-card text-xs transition-all cursor-pointer",
              statusFilter === "pending" && "ring-2 ring-primary border-primary/50"
            )}
          >
            <span className="text-muted-foreground">{t("pending")}</span>
            <span className="font-bold">{metrics.pending}</span>
          </button>

          {metrics.overdue > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-medium">
              <AlertCircle size={13} />
              <span>{t("overdueCount", { count: metrics.overdue })}</span>
            </div>
          )}

          {metrics.dueToday > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium">
              <Clock size={13} />
              <span>{t("todayCount", { count: metrics.dueToday })}</span>
            </div>
          )}

          <button
            onClick={() => setStatusFilter("completed")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-card text-xs transition-all cursor-pointer",
              statusFilter === "completed" && "ring-2 ring-primary border-primary/50"
            )}
          >
            <span className="text-muted-foreground">{t("completed")}</span>
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
              placeholder={t("searchPlaceholder")}
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
                <SelectValue placeholder={t("board")}>
                  {boardFilter === "all"
                    ? t("allBoards")
                    : (boards.find((b) => b.id === boardFilter)?.title ?? t("board"))}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  {t("allBoards")}
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
              <SelectValue placeholder={t("myRole")}>
                {roleFilter === "all"
                  ? t("allRoles")
                  : roleFilter === "assignee"
                    ? t("assignee")
                    : roleFilter === "collaborator"
                      ? t("collaborator")
                      : t("qa")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                {t("allRoles")}
              </SelectItem>
              <SelectItem value="assignee" className="text-xs">
                {t("assignee")}
              </SelectItem>
              <SelectItem value="collaborator" className="text-xs">
                {t("collaborator")}
              </SelectItem>
              <SelectItem value="qa" className="text-xs">
                {t("qa")}
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select value={priorityFilter} onValueChange={(val) => setPriorityFilter(val ?? "all")}>
            <SelectTrigger className="h-8 text-xs w-auto min-w-28 bg-background">
              <SelectValue placeholder={tPriority("label")}>
                {priorityFilter === "all"
                  ? tPriority("all")
                  : tPriority(priorityFilter as "urgent" | "high" | "medium" | "low")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                {tPriority("all")}
              </SelectItem>
              <SelectItem value="urgent" className="text-xs">
                {tPriority("urgent")}
              </SelectItem>
              <SelectItem value="high" className="text-xs">
                {tPriority("high")}
              </SelectItem>
              <SelectItem value="medium" className="text-xs">
                {tPriority("medium")}
              </SelectItem>
              <SelectItem value="low" className="text-xs">
                {tPriority("low")}
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
              {tFilters("all")}
            </ToggleGroupItem>
            <ToggleGroupItem value="pending" className="text-xs h-7 px-2.5">
              {tFilters("pending")}
            </ToggleGroupItem>
            <ToggleGroupItem value="completed" className="text-xs h-7 px-2.5">
              {tFilters("completed")}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Group By Selector */}
        <div className="flex items-center gap-1.5 self-end lg:self-auto shrink-0">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <ArrowUpDown size={12} /> {t("groupBy")}
          </span>
          <ToggleGroup
            value={[groupBy]}
            onValueChange={(val: string[]) => {
              const next = val.find((v) => v !== groupBy) ?? groupBy;
              setGroupBy(next as GroupByOption);
            }}
            className="border rounded-lg bg-background p-0.5"
          >
            <ToggleGroupItem value="events" className="text-xs h-7 px-2" title={t("byEventsTitle")}>
              {t("byEvents")}
            </ToggleGroupItem>
            <ToggleGroupItem value="board" className="text-xs h-7 px-2" title={t("byBoardTitle")}>
              {t("byBoard")}
            </ToggleGroupItem>
            <ToggleGroupItem value="role" className="text-xs h-7 px-2" title={t("byRoleTitle")}>
              {t("byRole")}
            </ToggleGroupItem>
            <ToggleGroupItem value="priority" className="text-xs h-7 px-2" title={t("byPriorityTitle")}>
              {t("byPriority")}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Task List Sections */}
      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed bg-card/50">
          <CheckCircle2 className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <h3 className="text-base font-semibold">{t("noTasks")}</h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1">
            {tasks.length === 0
              ? t("noAssigned")
              : t("noMatch")}
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
                        title={t("openOnBoard")}
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
