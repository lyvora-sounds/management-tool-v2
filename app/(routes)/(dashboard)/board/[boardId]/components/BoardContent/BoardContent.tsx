"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useBoardPolling } from "@/hooks/use-board-polling";
import { Progress } from "@/components/ui/progress";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import type { TaskModel } from "@/lib/generated/prisma/models/Task";
import type { ListWithTasks, TaskWithLabels } from "../TaskCard/TaskCard.types";
import { useBoardStore } from "../../store/useBoardStore";
import { ListItem } from "../ListItem/ListItem";
import { CreateListForm } from "../CreateListForm/CreateListForm";
import { TaskModal } from "../TaskModal/TaskModal";
import { BoardContentProps } from "./BoardContent.types";
import { BoardFilters } from "../BoardFilters/BoardFilters";
import { BoardFiltersState } from "../BoardFilters/BoardFilters.types";
import { BoardListView } from "../BoardListView/BoardListView";
import { LayoutList, Columns3 } from "lucide-react";
import { DEFAULT_FILTERS } from "./BoardContent.constants";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

function taskMatchesFilters(
  task: TaskWithLabels,
  filters: BoardFiltersState,
): boolean {
  // Archive Status
  const isArchived = Boolean(task.archived);
  if (filters.archiveStatus === "active" && isArchived) return false;
  if (filters.archiveStatus === "archived" && !isArchived) return false;


  // Labels — task must have ALL selected labels
  if (filters.labelIds.length > 0) {
    const taskLabelIds = task.labels.map((l) => l.label.id);
    if (!filters.labelIds.every((id) => taskLabelIds.includes(id)))
      return false;
  }

  // Due date
  if (filters.dueDate !== "all") {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);

    if (filters.dueDate === "none") {
      if (task.dueDate) return false;
    } else if (filters.dueDate === "overdue") {
      if (!task.dueDate || new Date(task.dueDate) >= today) return false;
    } else if (filters.dueDate === "today") {
      if (!task.dueDate) return false;
      const due = new Date(task.dueDate);
      const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      if (dueDay.getTime() !== today.getTime()) return false;
    } else if (filters.dueDate === "week") {
      if (!task.dueDate) return false;
      const due = new Date(task.dueDate);
      if (due < today || due >= weekEnd) return false;
    }
  }
  // Member filter
  if (filters.memberId && filters.memberId !== "all") {
    if (filters.memberId === "unassigned") {
      const hasAssignee = Boolean(task.assigneeId || task.assignee);
      const hasCollabs = Boolean(task.collaborators && task.collaborators.length > 0);
      const hasQa = Boolean(task.qaId || task.qa);
      if (hasAssignee || hasCollabs || hasQa) return false;
    } else {
      const matchesAssignee =
        task.assigneeId === filters.memberId || task.assignee?.id === filters.memberId;
      const matchesCollab = task.collaborators?.some(
        (c) => c.user.id === filters.memberId,
      );
      const matchesQa =
        task.qaId === filters.memberId || task.qa?.id === filters.memberId;
      if (!matchesAssignee && !matchesCollab && !matchesQa) return false;
    }
  }

  return true;
}

export function BoardContent({
  lists: initialLists,
  boardId,
  canManage,
  boardUsers,
  memberCanAssign,
}: BoardContentProps) {
  const t = useTranslations("board");
  useBoardPolling();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const taskIdParam = searchParams.get("taskId");

  const lists = useBoardStore((s) => s.lists);
  const setLists = useBoardStore((s) => s.setLists);
  const reorderLists = useBoardStore((s) => s.reorderLists);
  const moveTask = useBoardStore((s) => s.moveTask);

  const [activeTask, setActiveTask] = useState<TaskModel | null>(null);
  const [activeList, setActiveList] = useState<ListWithTasks | null>(null);
  const [dragOriginListId, setDragOriginListId] = useState<string | null>(null);
  const [filters, setFilters] = useState<BoardFiltersState>(DEFAULT_FILTERS);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [epics, setEpics] = useState<{ id: string; title: string; color: string }[]>([]);

  const effectiveLists = lists && lists.length > 0 ? lists : initialLists;

  const urlTaskEntry = useMemo(() => {
    if (!taskIdParam) return null;
    for (const list of effectiveLists) {
      const task = list.tasks.find((t) => t.id === taskIdParam);
      if (task) {
        return { task, listId: list.id, listTitle: list.title };
      }
    }
    return null;
  }, [effectiveLists, taskIdParam]);

  const handleCloseUrlModal = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("taskId");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  useEffect(() => {
    setLists(initialLists);
  }, [initialLists, setLists]);

  useEffect(() => {
    fetch(`/api/boards/${boardId}/epics`)
      .then((res) => res.json())
      .then((data) => setEpics(data.epics || []))
      .catch(() => {});
  }, [boardId]);

  const availableLabels = useMemo(() => {
    const map = new Map<string, { id: string; title: string; color: string }>();
    for (const list of lists) {
      for (const task of list.tasks) {
        for (const { label } of task.labels) {
          if (!map.has(label.id)) map.set(label.id, label);
        }
      }
    }
    return Array.from(map.values());
  }, [lists]);

  const availableQuarters = useMemo(() => {
    const set = new Set<string>();
    for (const list of lists) {
      for (const task of list.tasks) {
        if (task.quarter) set.add(task.quarter);
      }
    }
    return Array.from(set).sort();
  }, [lists]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const listIds = useMemo(() => lists.map((l) => l.id), [lists]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type;
    if (type === "list") {
      const list = lists.find((l) => l.id === active.id);
      setActiveList(list ?? null);
    } else if (type === "task") {
      const task = active.data.current?.task as TaskWithLabels;
      const listId = active.data.current?.listId as string;
      setActiveTask(task ?? null);
      setDragOriginListId(listId);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;
    if (activeType !== "task") return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const sourceListId = active.data.current?.listId as string;
    let targetListId: string;

    if (overType === "list") {
      targetListId = overId;
    } else if (overType === "task") {
      targetListId = over.data.current?.listId as string;
    } else {
      return;
    }

    if (activeId === overId) return;

    // Dentro de la misma lista solo hay destino si se está sobre otra tarea;
    // sobre el contenedor de la propia lista no hay nada que reordenar.
    if (sourceListId === targetListId && overType !== "task") return;

    const sourceList = lists.find((l) => l.id === sourceListId);
    const targetList = lists.find((l) => l.id === targetListId);
    if (!sourceList || !targetList) return;

    const taskIndex = sourceList.tasks.findIndex((t) => t.id === activeId);
    if (taskIndex === -1) return;

    let newIndex = targetList.tasks.length;
    if (overType === "task") {
      const overIndex = targetList.tasks.findIndex((t) => t.id === overId);
      newIndex = overIndex >= 0 ? overIndex : targetList.tasks.length;
    }

    // Mutate state optimistically.
    // El orden de los argumentos importa: (tarea, lista origen, lista destino, índice).
    moveTask(activeId, sourceListId, targetListId, newIndex);
    active.data.current = { ...active.data.current, listId: targetListId };
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const fromListId = dragOriginListId;
    setActiveTask(null);
    setActiveList(null);
    setDragOriginListId(null);
    if (!over) return;

    const activeType = active.data.current?.type;

    if (activeType === "list" && active.id !== over.id) {
      const oldIndex = lists.findIndex((l) => l.id === active.id);
      const newIndex = lists.findIndex((l) => l.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const newLists = arrayMove(lists, oldIndex, newIndex);
      reorderLists(oldIndex, newIndex);

      await fetch("/api/lists/updateOrder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boardId,
          lists: newLists.map((l, index) => ({ id: l.id, order: index })),
        }),
      });
    }

    if (activeType === "task") {
      const activeId = active.id as string;
      const currentListId = active.data.current?.listId as string;
      const targetList = lists.find((l) => l.id === currentListId);
      if (!targetList) return;

      const taskUpdates = lists.flatMap((list) =>
        list.tasks.map((task, i) => ({
          id: task.id,
          order: i,
          listId: list.id,
        })),
      );

      await fetch("/api/tasks/updateOrder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: taskUpdates,
          movedTaskId: activeId,
          fromListId,
          toListId: currentListId,
        }),
      });
    }
  };

  const filteredLists = useMemo(() => {
    return lists.map((list) => ({
      ...list,
      tasks: list.tasks.filter((task) => taskMatchesFilters(task, filters)),
    }));
  }, [lists, filters]);

  const totalTasks = lists.reduce((acc, l) => acc + l.tasks.length, 0);
  const doneTasks = lists.reduce(
    (acc, l) => acc + l.tasks.filter((t) => t.completed).length,
    0,
  );
  const progress =
    totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-2">
        <BoardFilters
          filters={filters}
          onChange={setFilters}
          availableLabels={availableLabels}
          availableEpics={epics}
          availableQuarters={availableQuarters}
          availableMembers={boardUsers}
        />
        <div data-tour="view-toggle" className="flex items-center gap-1 ml-auto shrink-0">
          <Button
            variant={view === "kanban" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setView("kanban")}
            title={t("kanbanView")}
          >
            <Columns3 size={16} />
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setView("list")}
            title={t("listView")}
          >
            <LayoutList size={16} />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      {totalTasks > 0 && (
        <div className="flex items-center gap-3">
          <Progress className="flex-1" value={progress} />
          <span className="text-xs text-muted-foreground tabular-nums shrink-0">
            {t("completedProgress", { done: doneTasks, total: totalTasks })}
          </span>
        </div>
      )}

      {view === "list" && (
        <BoardListView
          lists={filteredLists}
          boardId={boardId}
          canManage={canManage}
          boardUsers={boardUsers}
          memberCanAssign={memberCanAssign}
        />
      )}

      {view === "kanban" && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={lists.map((l) => l.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div data-tour="board-lists" className="flex gap-4 overflow-x-auto pb-4 items-start">
              {lists.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 w-64 py-10 rounded-xl border-2 border-dashed border-border/50 text-muted-foreground/60 shrink-0 select-none">
                  <Columns3 size={20} />
                  <p className="text-xs text-center leading-relaxed">
                    {t("emptyLists")}
                    <br />
                    {t("emptyListsHint")}
                  </p>
                </div>
              )}
              {filteredLists.map((list) => (
                <ListItem
                  key={list.id}
                  list={list}
                  boardId={boardId}
                  canManage={canManage}
                  boardUsers={boardUsers}
                  memberCanAssign={memberCanAssign}
                />
              ))}
              <CreateListForm boardId={boardId} />
            </div>
          </SortableContext>

          <DragOverlay>
            {activeTask && (
              <div className="bg-background rounded-lg px-3 py-2 shadow-md border text-sm rotate-2 opacity-95">
                {activeTask.title}
              </div>
            )}
            {activeList && (
              <div className="bg-muted rounded-xl w-64 p-3 shadow-md opacity-95">
                <h3 className="font-semibold text-sm">{activeList.title}</h3>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {urlTaskEntry && (
        <TaskModal
          task={urlTaskEntry.task}
          listId={urlTaskEntry.listId}
          listTitle={urlTaskEntry.listTitle}
          boardId={boardId}
          open={Boolean(urlTaskEntry)}
          onClose={handleCloseUrlModal}
          canManage={canManage}
          boardUsers={boardUsers}
          memberCanAssign={memberCanAssign}
        />
      )}
    </div>
  );
}
