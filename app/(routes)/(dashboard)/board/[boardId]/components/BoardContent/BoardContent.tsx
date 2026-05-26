"use client";

import { useEffect, useMemo, useState } from "react";
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
import { BoardContentProps } from "./BoardContent.types";
import { BoardFilters } from "../BoardFilters/BoardFilters";
import { BoardFiltersState } from "../BoardFilters/BoardFilters.types";
import { BoardListView } from "../BoardListView/BoardListView";
import { LayoutList, Columns3 } from "lucide-react";
import { DEFAULT_FILTERS } from "./BoardContent.constants";
import { Button } from "@/components/ui/button";

function taskMatchesFilters(
  task: TaskWithLabels,
  filters: BoardFiltersState,
): boolean {
  // Status
  if (filters.status === "completed" && !task.completed) return false;
  if (filters.status === "pending" && task.completed) return false;

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

  return true;
}

export function BoardContent({
  lists: initialLists,
  boardId,
  isOwner,
  boardUsers,
  memberCanAssign,
}: BoardContentProps) {
  useBoardPolling();

  const { lists, setLists, reorderLists, moveTask } = useBoardStore();
  const [activeTask, setActiveTask] = useState<TaskModel | null>(null);
  const [activeList, setActiveList] = useState<ListWithTasks | null>(null);
  const [dragOriginListId, setDragOriginListId] = useState<string | null>(null);
  const [filters, setFilters] = useState<BoardFiltersState>(DEFAULT_FILTERS);
  const [view, setView] = useState<"kanban" | "list">("kanban");

  useEffect(() => {
    setLists(initialLists);
  }, [initialLists, setLists]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Collect all unique labels from all tasks
  const availableLabels = useMemo(() => {
    const map = new Map<string, { id: string; title: string; color: string }>();
    lists.forEach((list) => {
      list.tasks.forEach((task) => {
        task.labels.forEach(({ label }) => {
          if (!map.has(label.id)) {
            map.set(label.id, {
              id: label.id,
              title: label.title,
              color: label.color,
            });
          }
        });
      });
    });
    return Array.from(map.values());
  }, [lists]);

  // Apply filters to lists (keep list structure, just filter tasks)
  const filteredLists = useMemo(() => {
    const isFiltering =
      filters.status !== "all" ||
      filters.dueDate !== "all" ||
      filters.labelIds.length > 0;

    if (!isFiltering) return lists;

    return lists.map((list) => ({
      ...list,
      tasks: list.tasks.filter((task) => taskMatchesFilters(task, filters)),
    }));
  }, [lists, filters]);

  const onDragStart = ({ active }: DragStartEvent) => {
    if (active.data.current?.type === "task") {
      setActiveTask(active.data.current.task);
      setDragOriginListId(active.data.current.listId as string);
    }
    if (active.data.current?.type === "list")
      setActiveList(active.data.current.list);
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || active.id === over.id) return;
    if (active.data.current?.type !== "task") return;

    const activeListId = active.data.current?.listId as string;
    const isOverTask = over.data.current?.type === "task";
    const isOverList = over.data.current?.type === "list";

    if (isOverTask) {
      const overListId = over.data.current?.listId as string;
      const targetList = lists.find((l) => l.id === overListId);
      const overIndex =
        targetList?.tasks.findIndex((t) => t.id === over.id) ?? 0;
      moveTask(active.id as string, activeListId, overListId, overIndex);
    }

    if (isOverList) {
      const overListId = over.id as string;
      if (activeListId === overListId) return;
      const targetList = lists.find((l) => l.id === overListId);
      const overIndex = targetList?.tasks.length ?? 0;
      moveTask(active.id as string, activeListId, overListId, overIndex);
    }
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const fromListId = dragOriginListId;
    setActiveTask(null);
    setActiveList(null);
    setDragOriginListId(null);
    if (!over) return;

    if (active.data.current?.type === "list" && active.id !== over.id) {
      const oldIndex = lists.findIndex((l) => l.id === active.id);
      const newIndex = lists.findIndex((l) => l.id === over.id);
      const reordered = arrayMove(lists, oldIndex, newIndex);
      reorderLists(oldIndex, newIndex);

      fetch("/api/lists/updateOrder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boardId,
          lists: reordered.map((l, i) => ({ id: l.id, order: i })),
        }),
      });
    }

    if (active.data.current?.type === "task") {
      const taskUpdates = lists.flatMap((list) =>
        list.tasks.map((task, i) => ({
          id: task.id,
          order: i,
          listId: list.id,
        })),
      );

      // Find the list where the task ended up  
      const toListId =
        lists.find((l) => l.tasks.some((t) => t.id === active.id))?.id ?? null;

      fetch("/api/tasks/updateOrder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: taskUpdates,
          movedTaskId: active.id,
          fromListId,
          toListId,
        }),
      });
    }
  };

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
        />
        <div className="flex items-center gap-1 ml-auto shrink-0">
          <Button
            variant={view === "kanban" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setView("kanban")}
            title="Vista Kanban"
          >
            <Columns3 size={16} />
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setView("list")}
            title="Vista Lista"
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
            {doneTasks}/{totalTasks} completadas
          </span>
        </div>
      )}

      {view === "list" && (
        <BoardListView
          lists={filteredLists}
          boardId={boardId}
          isOwner={isOwner}
          boardUsers={boardUsers}
        />
      )}

      {view === "kanban" && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={lists.map((l) => l.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex gap-4 overflow-x-auto pb-4 items-start">
              {lists.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 w-64 py-10 rounded-xl border-2 border-dashed border-border/50 text-muted-foreground/60 shrink-0 select-none">
                  <Columns3 size={20} />
                  <p className="text-xs text-center leading-relaxed">
                    Crea tu primera lista
                    <br />
                    para empezar a organizar
                  </p>
                </div>
              )}
              {filteredLists.map((list) => (
                <ListItem
                  key={list.id}
                  list={list}
                  boardId={boardId}
                  isOwner={isOwner}
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
    </div>
  );
}
