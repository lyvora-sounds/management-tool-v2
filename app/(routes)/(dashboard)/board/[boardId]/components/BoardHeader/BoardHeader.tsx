"use client";

import { useRef, useState } from "react";
import { Activity, MoreHorizontal, Trash2, Pencil, Users, ShieldCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBoardsStore } from "@/store/useBoardsStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BoardHeaderProps } from "./BoardHeader.types";
import { BoardMembers } from "../BoardMembers/BoardMembers";
import { BoardActivity } from "../BoardActivity/BoardActivity";
import { BoardLinks } from "../BoardLinks/BoardLinks";
import { BoardPermissions } from "../BoardPermissions/BoardPermissions";
import { ConfirmModal } from "@/components/Shared/ModalDeleteConfirmation/ModalDeleteConfirmation";

export function BoardHeader({ boardId, title, isOwner, initialLinks, memberCanAssign }: BoardHeaderProps) {
  const router = useRouter();
  const renameBoard = useBoardsStore((s) => s.renameBoard);
  const removeBoard = useBoardsStore((s) => s.removeBoard);

  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [savedTitle, setSavedTitle] = useState(title);
  const [loading, setLoading] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const cancelEditing = () => {
    setValue(savedTitle);
    setIsEditing(false);
  };

  const save = async () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === savedTitle) {
      cancelEditing();
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/boards/updateBoard/${boardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed }),
    });
    if (res.ok) {
      renameBoard(boardId, trimmed);
      setSavedTitle(trimmed);
      toast.success("Board renombrado");
      router.refresh();
    } else {
      setValue(savedTitle);
      toast.error("Error al renombrar el board");
    }
    setIsEditing(false);
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    const res = await fetch(`/api/boards/deleteBoard/${boardId}`, { method: "DELETE" });
    if (res.ok) {
      removeBoard(boardId);
      router.push("/dashboard/boards");
    } else {
      toast.error("Error al eliminar el board");
      setLoading(false);
    }
  };

  return (
    <>
      <ConfirmModal
        open={confirmDelete}
        title="Eliminar board"
        description={`¿Eliminar "${savedTitle}"? Se perderán todas las listas y tareas. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        loading={loading}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
      <BoardMembers
        boardId={boardId}
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
      />
      <BoardActivity
        boardId={boardId}
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
      />
      {isOwner && (
        <BoardPermissions
          boardId={boardId}
          open={permissionsOpen}
          onClose={() => setPermissionsOpen(false)}
          initialMemberCanAssign={memberCanAssign}
        />
      )}

      <div className="flex items-center justify-between gap-2 min-w-0">
        {isEditing ? (
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") cancelEditing();
            }}
            disabled={loading}
            className="text-xl sm:text-2xl font-bold w-auto rounded-xl"
            autoFocus
          />
        ) : (
          <h1
            className="text-xl sm:text-2xl font-bold cursor-pointer hover:opacity-75 transition-opacity truncate"
            onClick={startEditing}
          >
            {value}
          </h1>
        )}

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <BoardLinks boardId={boardId} isOwner={isOwner} initialLinks={initialLinks} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActivityOpen(true)}
            disabled={loading}
          >
            <Activity size={15} />
            <span className="hidden sm:inline">Actividad</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMembersOpen(true)}
            disabled={loading}
          >
            <Users size={15} />
            <span className="hidden sm:inline">Miembros</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition"
              disabled={loading}
            >
              <MoreHorizontal size={18} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={startEditing} className="cursor-pointer">
                <Pencil size={14} />
                Renombrar board
              </DropdownMenuItem>
              {isOwner && (
                <DropdownMenuItem onClick={() => setPermissionsOpen(true)} className="cursor-pointer">
                  <ShieldCheck size={14} />
                  Permisos
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setConfirmDelete(true)}
                disabled={loading}
              >
                <Trash2 size={14} />
                Eliminar board
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
}
