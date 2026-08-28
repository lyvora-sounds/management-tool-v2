"use client";

import type { ReactNode } from "react";
import {
  Calendar,
  User,
  Users,
  ShieldCheck,
  CheckSquare2,
  MessageSquare,
  Paperclip,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDueDate, PRIORITY_CONFIG } from "@/lib/taskDisplay";
import {
  TaskStatusSelect,
  type StatusListOption,
} from "@/components/TaskStatusSelect/TaskStatusSelect";

export type DashboardTaskRowTask = {
  id: string;
  title: string;
  completed: boolean;
  priority?: string | null;
  dueDate?: Date | string | null;
  quarter?: string | null;
  epic?: { title: string; color: string } | null;
  _count?: { comments?: number; attachments?: number };
  subtasks?: { completed: boolean }[];
  list: {
    id: string;
    title: string;
    board: { id: string; title: string };
  };
};

export function DashboardTaskRow({
  task,
  isAssignee,
  isCollab,
  isQa,
  lists,
  updating = false,
  onOpen,
  onOpenBoard,
  onStatusChange,
  trailing,
}: {
  task: DashboardTaskRowTask;
  isAssignee: boolean;
  isCollab: boolean;
  isQa: boolean;
  lists: StatusListOption[];
  updating?: boolean;
  onOpen: () => void;
  onOpenBoard: () => void;
  onStatusChange: (listId: string) => void;
  trailing?: ReactNode;
}) {
  const priorityInfo = task.priority ? PRIORITY_CONFIG[task.priority.toLowerCase()] : null;
  const dueInfo = task.dueDate ? formatDueDate(task.dueDate) : null;
  const subtasks = task.subtasks ?? [];
  const subtaskCount = subtasks.length;
  const subtaskDone = subtasks.filter((s) => s.completed).length;
  const commentCount = task._count?.comments ?? 0;
  const attachmentCount = task._count?.attachments ?? 0;

  return (
    <div
      onClick={onOpen}
      className={cn(
        "group relative flex items-center justify-between gap-4 px-4 py-3 rounded-xl border bg-card hover:bg-muted/40 hover:border-primary/40 transition-all shadow-xs cursor-pointer select-none text-foreground w-full",
        task.completed && "opacity-60 bg-muted/20",
      )}
    >
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "text-sm font-medium leading-snug break-words group-hover:text-primary transition-colors cursor-pointer",
              task.completed && "line-through text-muted-foreground",
            )}
          >
            {task.title}
          </span>

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

          {task.epic && (
            <span
              className="text-[9px] font-semibold px-1.5 py-0.2 rounded text-white shrink-0"
              style={{ backgroundColor: task.epic.color }}
            >
              {task.epic.title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
          <span
            onClick={(e) => {
              e.stopPropagation();
              onOpenBoard();
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

      <div
        className="flex items-center gap-2.5 shrink-0 ml-auto"
        onClick={(e) => e.stopPropagation()}
      >
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
            <span className="flex items-center gap-1 tabular-nums" title={`${commentCount} comentarios`}>
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

        <div
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="shrink-0"
        >
          <TaskStatusSelect
            currentListId={task.list.id}
            currentListTitle={task.list.title}
            completed={task.completed}
            lists={lists}
            updating={updating}
            onSelect={onStatusChange}
          />
        </div>

        {trailing}
      </div>
    </div>
  );
}
