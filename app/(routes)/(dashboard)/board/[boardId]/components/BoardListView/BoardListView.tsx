"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Calendar,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBoardStore } from "../../store/useBoardStore";
import { TaskModal } from "../TaskModal/TaskModal";
import { getPriority } from "../TaskPriority/TaskPriority.constants";
import { BoardListViewProps, TaskRowProps } from "./BoardListView.types";
import type { ListWithTasks, BoardUser } from "../TaskCard/TaskCard.types";

function getInitials(name: string | null, email: string) {
  if (name)
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  return email[0].toUpperCase();
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return null;
  const d = new Date(date);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function isDueSoon(date: Date | string | null | undefined) {
  if (!date) return false;
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = d.getTime() - today.getTime();
  return diff >= 0 && diff <= 3 * 24 * 60 * 60 * 1000;
}

function isOverdue(date: Date | string | null | undefined) {
  if (!date) return false;
  return new Date(date) < new Date();
}

function TaskRow({
  task,
  listId,
  listTitle,
  boardId,
  isOwner,
  boardUsers,
  memberCanAssign,
}: TaskRowProps) {
  const updateTask = useBoardStore((s) => s.updateTask);
  const [completed, setCompleted] = useState(task.completed);
  const [modalOpen, setModalOpen] = useState(false);
  const priority = getPriority(task.priority);

  const toggleCompleted = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !completed;
    setCompleted(next);
    await fetch(`/api/tasks/updateTask/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: next }),
    });
    updateTask(listId, task.id, { completed: next });
  };

  const due = task.dueDate;
  const dueSoon = isDueSoon(due);
  const overdue = isOverdue(due) && !completed;

  return (
    <>
      <div
        onClick={() => setModalOpen(true)}
        className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border"
      >
        {/* Checkbox */}
        <div
          onClick={toggleCompleted}
          className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
        >
          {completed ? (
            <CheckCircle2 size={16} className="text-primary" />
          ) : (
            <Circle size={16} />
          )}
        </div>

        {/* Priority dot */}
        {priority && (
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: priority.color }}
            title={priority.label}
          />
        )}

        {/* Title */}
        <span
          className={cn(
            "flex-1 text-sm min-w-0 truncate",
            completed && "line-through text-muted-foreground",
          )}
        >
          {task.title}
        </span>

        {/* Priority badge */}
        {priority && (
          <span
            className={cn(
              "text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 hidden sm:block",
              priority.bg,
            )}
          >
            {priority.label}
          </span>
        )}

        {/* Due date */}
        {due && (
          <span
            className={cn(
              "flex items-center gap-1 text-xs shrink-0",
              overdue
                ? "text-red-500"
                : dueSoon
                  ? "text-orange-500"
                  : "text-muted-foreground",
            )}
          >
            <Calendar size={12} />
            {formatDate(due)}
          </span>
        )}

        {/* Assignees */}
        {task.assignees.length > 0 && (
          <div className="flex -space-x-1.5 shrink-0">
            {task.assignees.slice(0, 3).map(({ user }) => (
              <div
                key={user.id}
                title={user.name ?? user.email}
                className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[9px] font-medium flex items-center justify-center ring-1 ring-background"
              >
                {getInitials(user.name, user.email)}
              </div>
            ))}
          </div>
        )}

        {/* Labels */}
        {task.labels.length > 0 && (
          <div className="flex gap-1 shrink-0">
            {task.labels.slice(0, 2).map(({ label }) => (
              <span
                key={label.id}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: label.color }}
                title={label.title}
              />
            ))}
          </div>
        )}
      </div>

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
    </>
  );
}

function ListGroup({
  list,
  boardId,
  isOwner,
  boardUsers,
  memberCanAssign,
}: {
  list: ListWithTasks;
  boardId: string;
  isOwner: boolean;
  boardUsers: BoardUser[];
  memberCanAssign: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex flex-col">
      {/* List header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted transition-colors w-full text-left"
      >
        {collapsed ? (
          <ChevronRight size={14} className="text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown size={14} className="text-muted-foreground shrink-0" />
        )}
        <span className="text-sm font-semibold">{list.title}</span>
        <span className="text-xs text-muted-foreground ml-1">
          {list.tasks.length} {list.tasks.length === 1 ? "tarea" : "tareas"}
        </span>
      </button>

      {!collapsed && (
        <div className="flex flex-col gap-0.5 ml-4 mt-0.5">
          {list.tasks.length === 0 ? (
            <p className="text-xs text-muted-foreground px-3 py-1.5">
              Sin tareas
            </p>
          ) : (
            list.tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                listId={list.id}
                listTitle={list.title}
                boardId={boardId}
                isOwner={isOwner}
                boardUsers={boardUsers}
                memberCanAssign={memberCanAssign}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function BoardListView({
  lists,
  boardId,
  isOwner,
  boardUsers,
  memberCanAssign,
}: BoardListViewProps) {
  return (
    <div className="flex flex-col gap-3 overflow-y-auto">
      {lists.map((list) => (
        <ListGroup
          key={list.id}
          list={list}
          boardId={boardId}
          isOwner={isOwner}
          boardUsers={boardUsers}
          memberCanAssign={memberCanAssign}
        />
      ))}
    </div>
  );
}
