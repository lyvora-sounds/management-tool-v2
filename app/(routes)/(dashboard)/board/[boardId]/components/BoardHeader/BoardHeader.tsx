"use client";

import { useRef, useState } from "react";
import {
  Activity,
  MoreHorizontal,
  Trash2,
  Pencil,
  Users,
  ShieldCheck,
  Sparkles,
  Layers,
  Archive,
  Webhook,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { BoardEpicsModal } from "../BoardEpicsModal/BoardEpicsModal";
import { ArchiveTasksModal } from "../ArchiveTasksModal/ArchiveTasksModal";
import { BoardIntegrationsModal } from "../BoardIntegrationsModal/BoardIntegrationsModal";
import { AiBrainDumpModal } from "../AiBrainDumpModal/AiBrainDumpModal";
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
  const [epicsOpen, setEpicsOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const [brainDumpOpen, setBrainDumpOpen] = useState(false);
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
      <BoardEpicsModal
        boardId={boardId}
        open={epicsOpen}
        onClose={() => setEpicsOpen(false)}
        onEpicsChange={() => router.refresh()}
      />
      <ArchiveTasksModal
        boardId={boardId}
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        onRefreshBoard={() => router.refresh()}
      />
      <BoardIntegrationsModal
        boardId={boardId}
        open={integrationsOpen}
        onClose={() => setIntegrationsOpen(false)}
      />
      <AiBrainDumpModal
        boardId={boardId}
        open={brainDumpOpen}
        onClose={() => setBrainDumpOpen(false)}
        onSuccess={() => router.refresh()}
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

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-wrap">
          {/* AI Brain Dump Button */}
          <Button
            size="sm"
            onClick={() => setBrainDumpOpen(true)}
            className="gap-1.5 h-8 text-xs bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-primary-foreground shadow-sm"
          >
            <Sparkles size={13} />
            <span className="hidden sm:inline">Brain Dump (IA)</span>
          </Button>

          {/* Epics Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEpicsOpen(true)}
            className="gap-1.5 h-8 text-xs"
          >
            <Layers size={13} />
            <span className="hidden sm:inline">Epics</span>
          </Button>

          {/* Archive Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setArchiveOpen(true)}
            className="gap-1.5 h-8 text-xs"
          >
            <Archive size={13} />
            <span className="hidden sm:inline">Archivo</span>
          </Button>

          <BoardLinks boardId={boardId} isOwner={isOwner} initialLinks={initialLinks} />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActivityOpen(true)}
            disabled={loading}
            className="h-8 text-xs"
          >
            <Activity size={14} />
            <span className="hidden md:inline">Actividad</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setMembersOpen(true)}
            disabled={loading}
            className="h-8 text-xs"
          >
            <Users size={14} />
            <span className="hidden md:inline">Miembros</span>
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
              <DropdownMenuItem onClick={() => setIntegrationsOpen(true)} className="cursor-pointer">
                <Webhook size={14} />
                Webhooks (Slack / Discord)
              </DropdownMenuItem>
              {isOwner && (
                <DropdownMenuItem onClick={() => setPermissionsOpen(true)} className="cursor-pointer">
                  <ShieldCheck size={14} />
                  Permisos
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
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

