"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  CheckSquare2,
  MessageSquare,
  Paperclip,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskCardProps } from "./TaskCard.types";
import { TaskActions } from "../TaskActions/TaskActions";
import { TaskModal } from "../TaskModal/TaskModal";
import { useBoardStore } from "../../store/useBoardStore";
import { getPriority } from "../TaskPriority/TaskPriority.constants";
import { targetListForCompletion } from "@/lib/statusTheme";
import { displayCustomFieldValue } from "@/lib/customValueUtils";

function getInitials(name: string | null | undefined, email: string | undefined) {
  if (name)
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  if (email) return email[0].toUpperCase();
  return "?";
}

export function TaskCard({
  task,
  listId,
  listTitle,
  boardId,
  isOwner,
  boardUsers,
  memberCanAssign,
}: TaskCardProps) {
  const updateTask = useBoardStore((s) => s.updateTask);
  const lists = useBoardStore((s) => s.lists);
  const [modalOpen, setModalOpen] = useState(false);
  const [completed, setCompleted] = useState(task.completed);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", task, listId },
    disabled: modalOpen,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const titleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const list of lists) {
      for (const item of list.tasks) {
        map.set(item.id, item.title);
      }
    }
    return map;
  }, [lists]);

  const toggleCompleted = async () => {
    const next = !completed;
    const boardLists = useBoardStore.getState().lists;
    const targetList = targetListForCompletion(boardLists, listId, next);

    if (targetList) {
      useBoardStore
        .getState()
        .moveTask(task.id, listId, targetList.id, targetList.tasks.length);
      useBoardStore
        .getState()
        .updateTask(targetList.id, task.id, { completed: next });
      setCompleted(next);

      await fetch(`/api/tasks/updateTask/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listId: targetList.id,
          completed: next,
        }),
      });
    } else {
      setCompleted(next);
      updateTask(listId, task.id, { completed: next });
      await fetch(`/api/tasks/updateTask/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: next }),
      });
    }
  };

  const priority = getPriority(task.priority);
  const subtasks = task.subtasks ?? [];
  const subtaskTotal = subtasks.length;
  const subtaskDone = subtasks.filter((s) => s.completed).length;
  const commentCount = task._count?.comments ?? 0;
  const attachmentCount = task._count?.attachments ?? 0;

  const due = task.dueDate ? new Date(task.dueDate) : null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const isOverdue = due && due < today && !completed;
  const isDueSoon =
    due &&
    !isOverdue &&
    due.getTime() - today.getTime() <= 3 * 24 * 60 * 60 * 1000;

  const hasFooter =
    subtaskTotal > 0 ||
    commentCount > 0 ||
    attachmentCount > 0 ||
    Boolean(due) ||
    Boolean(task.assignee) ||
    Boolean(task.qa);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group bg-background rounded-lg px-3 py-2 shadow-sm border text-sm cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors flex flex-col gap-1.5"
    >
      {/* Top row: checkbox + title + priority + actions */}
      <div className="flex items-center gap-2">
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onClick={toggleCompleted}
          className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary transition-all cursor-pointer"
        >
          {completed ? (
            <CheckCircle2 size={15} className="text-primary opacity-100" />
          ) : (
            <Circle size={15} />
          )}
        </div>

        <span
          className={cn(
            "flex-1 cursor-pointer leading-snug",
            completed && "line-through text-muted-foreground",
          )}
          onClick={() => setModalOpen(true)}
        >
          {task.title}
        </span>

        {priority && (
          <span
            className={cn(
              "text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0",
              priority.bg,
            )}
          >
            {priority.label}
          </span>
        )}

        <div onPointerDown={(e) => e.stopPropagation()}>
          <TaskActions taskId={task.id} listId={listId} />
        </div>
      </div>

      {(task.epic || task.quarter || (task.customValues && task.customValues.length > 0)) && (
        <div className="flex items-center gap-1.5 pl-6 flex-wrap">
          {task.epic && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.2 rounded text-white"
              style={{ backgroundColor: task.epic.color }}
            >
              {task.epic.title}
            </span>
          )}
          {task.quarter && (
            <span className="text-[10px] text-muted-foreground font-medium px-1 py-0.2 rounded bg-muted">
              {task.quarter}
            </span>
          )}
          {(task.customValues ?? [])
            .filter((cv) => cv.value && cv.customField?.enabled !== false)
            .map((cv) => {
              const displayVal = displayCustomFieldValue(
                cv.value as string,
                cv.customField?.defaultKey,
                titleById,
              );

              return (
                <span
                  key={cv.id}
                  title={`${cv.customField?.name || "Valor"}: ${displayVal}`}
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 max-w-44 truncate"
                >
                  {cv.customField?.defaultKey === "story_points"
                    ? `${displayVal} SP`
                    : `${cv.customField?.name}: ${displayVal}`}
                </span>
              );
            })}
        </div>
      )}

      {/* Footer row: indicators & assignee */}
      {hasFooter && (
        <div className="flex items-center justify-between gap-2 pl-6 text-muted-foreground pt-0.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            {due && (
              <span
                className={cn(
                  "flex items-center gap-1 text-[11px]",
                  isOverdue
                    ? "text-red-500 font-medium"
                    : isDueSoon
                      ? "text-orange-500"
                      : "text-muted-foreground",
                )}
              >
                <Calendar size={11} />
                {due.toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "short",
                })}
              </span>
            )}
            {subtaskTotal > 0 && (
              <span
                className={cn(
                  "flex items-center gap-1 text-[11px]",
                  subtaskDone === subtaskTotal
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              >
                <CheckSquare2 size={11} />
                {subtaskDone}/{subtaskTotal}
              </span>
            )}
            {commentCount > 0 && (
              <span className="flex items-center gap-1 text-[11px]">
                <MessageSquare size={11} />
                {commentCount}
              </span>
            )}
            {attachmentCount > 0 && (
              <span className="flex items-center gap-1 text-[11px]">
                <Paperclip size={11} />
                {attachmentCount}
              </span>
            )}
          </div>

          {/* Assignee & QA Avatars visible on card */}
          <div className="flex items-center gap-1 shrink-0 ml-auto">
            {task.qa && (
              <div
                title={`QA: ${task.qa.name ?? task.qa.email}`}
                className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center ring-1 ring-background shadow-xs"
              >
                {getInitials(task.qa.name, task.qa.email)}
              </div>
            )}
            {task.assignee && (
              <div
                title={`Asignado: ${task.assignee.name ?? task.assignee.email}`}
                className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center ring-1 ring-background shadow-xs"
              >
                {getInitials(task.assignee.name, task.assignee.email)}
              </div>
            )}
          </div>
        </div>
      )}

      {modalOpen && (
        <TaskModal
          task={task}
          listId={listId}
          listTitle={listTitle}
          boardId={boardId}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          isOwner={isOwner}
          boardUsers={boardUsers}
          memberCanAssign={memberCanAssign}
        />
      )}
    </div>
  );
}
