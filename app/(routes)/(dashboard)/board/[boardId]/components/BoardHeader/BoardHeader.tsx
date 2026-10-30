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
import { useTranslations } from "next-intl";
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
import { apiFetch } from "@/lib/apiClient";

export function BoardHeader({ boardId, title, isOwner, canManage, canEdit, initialLinks, memberCanAssign, boardKey, keyLocked }: BoardHeaderProps) {
  const t = useTranslations("board");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const renameBoard = useBoardsStore((s) => s.renameBoard);
  const removeBoard = useBoardsStore((s) => s.removeBoard);

  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [savedTitle, setSavedTitle] = useState(title);
  const [keyValue, setKeyValue] = useState(boardKey);
  const [savedKey, setSavedKey] = useState(boardKey);
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
    const res = await apiFetch(`/api/boards/updateBoard/${boardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed }),
    });
    if (res.ok) {
      renameBoard(boardId, trimmed);
      setSavedTitle(trimmed);
      toast.success(t("renamed"));
      router.refresh();
    } else {
      setValue(savedTitle);
      toast.error(t("renameError"));
    }
    setIsEditing(false);
    setLoading(false);
  };

  const saveKey = async () => {
    const next = keyValue.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(next) || next === savedKey) {
      setKeyValue(savedKey);
      return;
    }
    setLoading(true);
    const res = await apiFetch(`/api/boards/updateBoard/${boardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: savedTitle, key: next }),
    });
    const updated = await res.json().catch(() => null);
    if (res.ok && updated?.key === next) {
      setSavedKey(next);
      setKeyValue(next);
      toast.success(t("boardKeySaved"));
      router.refresh();
    } else {
      setKeyValue(savedKey);
      toast.error(updated?.error === "taken" ? t("boardKeyTaken") : t("boardKeyError"));
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    const res = await apiFetch(`/api/boards/deleteBoard/${boardId}`, { method: "DELETE" });
    if (res.ok) {
      removeBoard(boardId);
      router.push("/dashboard/boards");
    } else {
      toast.error(t("deleteError"));
      setLoading(false);
    }
  };

  return (
    <>
      <ConfirmModal
        open={confirmDelete}
        title={t("deleteTitle")}
        description={t("deleteDescription", { title: savedTitle })}
        confirmLabel={tCommon("delete")}
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
        canEdit={canEdit}
        open={epicsOpen}
        onClose={() => setEpicsOpen(false)}
        onEpicsChange={() => router.refresh()}
      />
      <ArchiveTasksModal
        boardId={boardId}
        canEdit={canEdit}
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        onRefreshBoard={() => router.refresh()}
      />
      <BoardIntegrationsModal
        boardId={boardId}
        canManage={canManage}
        open={integrationsOpen}
        onClose={() => setIntegrationsOpen(false)}
      />
      <AiBrainDumpModal
        boardId={boardId}
        open={brainDumpOpen}
        onClose={() => setBrainDumpOpen(false)}
        onSuccess={() => router.refresh()}
      />
      {/* Los permisos del tablero los toca quien lo gestiona, no solo el
          propietario: es lo que ya aceptaba PATCH /permissions. */}
      {canManage && (
        <BoardPermissions
          boardId={boardId}
          open={permissionsOpen}
          onClose={() => setPermissionsOpen(false)}
          initialMemberCanAssign={memberCanAssign}
        />
      )}

      <div className="flex items-center justify-between gap-2 min-w-0">
      <div className="flex items-center gap-2 min-w-0">
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
            className={`text-xl sm:text-2xl font-bold truncate ${isOwner ? "cursor-pointer hover:opacity-75 transition-opacity" : ""}`}
            onClick={() => {
              if (isOwner) startEditing();
            }}
          >
            {value}
          </h1>
        )}
        {isOwner && !keyLocked ? (
          <Input
            value={keyValue}
            aria-label={t("boardKey")}
            title={t("boardKeyHint")}
            maxLength={2}
            disabled={loading}
            onChange={(event) => setKeyValue(event.target.value.toUpperCase())}
            onBlur={saveKey}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
              if (event.key === "Escape") setKeyValue(savedKey);
            }}
            className="h-7 w-12 shrink-0 px-1.5 text-center font-mono text-xs uppercase"
          />
        ) : (
          <span title={t("boardKeyHint")} className="shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
            {savedKey}
          </span>
        )}
      </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-wrap">
          {/* AI Brain Dump Button */}
          {canEdit && <Button
            data-tour="board-ai"
            size="sm"
            onClick={() => setBrainDumpOpen(true)}
            className="workspace-ai-button gap-1.5 h-8 text-xs bg-gradient-to-r from-primary to-primary/75 hover:from-primary/90 hover:to-primary/65 text-primary-foreground shadow-sm cursor-pointer"
          >
            <Sparkles size={13} />
            <span className="hidden sm:inline">{t("aiBrainDump")}</span>
          </Button>}

          {/* Epics Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEpicsOpen(true)}
            className="gap-1.5 h-8 text-xs cursor-pointer"
          >
            <Layers size={13} />
            <span className="hidden sm:inline">{t("epics")}</span>
          </Button>

          {/* Archive Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setArchiveOpen(true)}
            className="gap-1.5 h-8 text-xs cursor-pointer"
          >
            <Archive size={13} />
            <span className="hidden sm:inline">{t("archive")}</span>
          </Button>

          <BoardLinks boardId={boardId} isOwner={isOwner} initialLinks={initialLinks} />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActivityOpen(true)}
            disabled={loading}
            className="h-8 text-xs cursor-pointer"
          >
            <Activity size={14} />
            <span className="hidden md:inline">{t("activity")}</span>
          </Button>

          <Button
            data-tour="board-members"
            data-guide="board-members"
            variant="outline"
            size="sm"
            onClick={() => setMembersOpen(true)}
            disabled={loading}
            className="h-8 text-xs cursor-pointer"
          >
            <Users size={14} />
            <span className="hidden md:inline">{t("members")}</span>
          </Button>

          {(isOwner || canManage) && <DropdownMenu>
            <DropdownMenuTrigger
              className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition cursor-pointer"
              disabled={loading}
            >
              <MoreHorizontal size={18} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwner && (
                <DropdownMenuItem onClick={startEditing} className="cursor-pointer">
                  <Pencil size={14} />
                  {t("renameBoard")}
                </DropdownMenuItem>
              )}
              {canManage && (
                <DropdownMenuItem onClick={() => setIntegrationsOpen(true)} className="cursor-pointer">
                  <Webhook size={14} />
                {t("integrations")}
                </DropdownMenuItem>
              )}
              {canManage && (
                <DropdownMenuItem onClick={() => setPermissionsOpen(true)} className="cursor-pointer">
                  <ShieldCheck size={14} />
                  {t("permissions")}
                </DropdownMenuItem>
              )}
              {isOwner && <DropdownMenuSeparator />}
              {isOwner && (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setConfirmDelete(true)}
                  disabled={loading}
                >
                  <Trash2 size={14} />
                  {t("deleteBoard")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>}
        </div>
      </div>
    </>
  );
}
