"use client";

import { useState } from "react";
import { MoreHorizontal, Trash2, CornerUpRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useBoardStore } from "../../store/useBoardStore";
import { TaskActionsProps } from "./TaskActions.types";
import { ConfirmModal } from "@/components/Shared/ModalDeleteConfirmation/ModalDeleteConfirmation";

export function TaskActions({ taskId, listId }: TaskActionsProps) {
  const removeTask = useBoardStore((s) => s.removeTask);
  const moveTask = useBoardStore((s) => s.moveTask);
  const lists = useBoardStore((s) => s.lists);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const otherLists = lists.filter((l) => l.id !== listId);

  const handleMove = async (toListId: string) => {
    const fromList = lists.find((l) => l.id === listId);
    const originalIndex = fromList?.tasks.findIndex((t) => t.id === taskId) ?? -1;
    if (originalIndex === -1) return;

    const targetList = lists.find((l) => l.id === toListId);
    const toIndex = targetList?.tasks.length ?? 0;

    setLoading(true);
    moveTask(taskId, listId, toListId, toIndex);

    // El payload se construye desde el estado completo del store y no desde
    // las listas que ve la vista, que pueden venir filtradas: si no, un filtro
    // activo reordenaría las tareas ocultas.
    const items = useBoardStore
      .getState()
      .lists.flatMap((l) =>
        l.tasks.map((t, i) => ({ id: t.id, order: i, listId: l.id })),
      );

    try {
      const res = await fetch("/api/tasks/updateOrder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          movedTaskId: taskId,
          fromListId: listId,
          toListId,
        }),
      });
      if (!res.ok) throw new Error("move failed");
      toast.success(`Movida a "${targetList?.title}"`);
    } catch {
      moveTask(taskId, toListId, listId, originalIndex);
      toast.error("No se pudo mover la tarea");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    const res = await fetch(`/api/tasks/deleteTask/${taskId}`, { method: "DELETE" });
    if (res.ok) {
      removeTask(listId, taskId);
      toast.success("Tarea eliminada");
    } else {
      toast.error("Error al eliminar la tarea");
    }
    setLoading(false);
  };

  return (
    <>
    <ConfirmModal
      open={confirmDelete}
      title="Eliminar tarea"
      description="¿Eliminar esta tarea? Se perderán todos sus comentarios, adjuntos y subtareas."
      confirmLabel="Eliminar"
      loading={loading}
      onConfirm={handleDelete}
      onCancel={() => setConfirmDelete(false)}
    />
    <DropdownMenu>
      <DropdownMenuTrigger
        className="p-1 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted transition"
        disabled={loading}
      >
        <MoreHorizontal size={14} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {otherLists.length > 0 && (
          <>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger disabled={loading}>
                <CornerUpRight size={14} />
                Mover a lista
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {otherLists.map((l) => (
                  <DropdownMenuItem
                    key={l.id}
                    onClick={() => handleMove(l.id)}
                    disabled={loading}
                    className="cursor-pointer"
                  >
                    {l.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          variant="destructive"
          onClick={() => setConfirmDelete(true)}
          disabled={loading}
        >
          <Trash2 size={14} />
          Eliminar tarea
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  );
}
