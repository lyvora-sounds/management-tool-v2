"use client";

import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ListItemProps } from "./ListItem.types";
import { TaskCard } from "../TaskCard/TaskCard";
import { CreateTaskForm } from "../CreateTaskForm/CreateTaskForm";
import { ListHeader } from "../ListHeader/ListHeader";
import { ArrowDownToLine } from "lucide-react";
import { useTranslations } from "next-intl";

export function ListItem({ list, boardId, canManage, boardUsers, memberCanAssign }: ListItemProps) {
  const t = useTranslations("board");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: list.id,
    data: { type: "list", list },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col bg-muted rounded-xl w-64 shrink-0 p-3 gap-2"
    >
      <div
        className="cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <ListHeader listId={list.id} title={list.title} taskCount={list.tasks.length} />
      </div>
      <SortableContext
        items={list.tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2">
          {list.tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1.5 py-6 rounded-lg border-2 border-dashed border-border/50 text-muted-foreground/50 select-none">
              <ArrowDownToLine size={16} />
              <span className="text-xs">{t("dropTicket")}</span>
            </div>
          ) : (
            list.tasks.map((task) => (
              <TaskCard key={task.id} task={task} listId={list.id} listTitle={list.title} boardId={boardId} canManage={canManage} boardUsers={boardUsers} memberCanAssign={memberCanAssign} />
            ))
          )}
        </div>
      </SortableContext>
      <CreateTaskForm listId={list.id} />
    </div>
  );
}
