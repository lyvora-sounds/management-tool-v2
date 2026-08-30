"use client";

import { useRef, useState } from "react";
import { MoreHorizontal, Trash2, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useBoardStore } from "../../store/useBoardStore";
import { ListHeaderProps } from "./ListHeader.types";
import { ConfirmModal } from "@/components/Shared/ModalDeleteConfirmation/ModalDeleteConfirmation";

export function ListHeader({ listId, title, taskCount }: ListHeaderProps) {
  const t = useTranslations("list");
  const tCommon = useTranslations("common");
  const renameList = useBoardStore((s) => s.renameList);
  const removeList = useBoardStore((s) => s.removeList);

  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [savedTitle, setSavedTitle] = useState(title);
  const [loading, setLoading] = useState(false);
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
    const res = await fetch(`/api/lists/updateList/${listId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed }),
    });
    if (res.ok) {
      renameList(listId, trimmed);
      setSavedTitle(trimmed);
      toast.success(t("renamed"));
    } else {
      toast.error(t("renameError"));
    }
    setIsEditing(false);
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    const res = await fetch(`/api/lists/deleteList/${listId}`, { method: "DELETE" });
    if (res.ok) {
      removeList(listId);
      toast.success(t("deleted"));
    } else {
      toast.error(t("deleteError"));
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-between px-1">
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
          className="font-semibold text-sm h-7 py-0 px-1 rounded-md shadow-none"
          autoFocus
        />
      ) : (
        <h3
          className="font-semibold text-sm cursor-pointer hover:opacity-75 transition-opacity truncate"
          onClick={startEditing}
        >
          {value}
        </h3>
      )}

      <div
        className="flex items-center gap-1 shrink-0"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span className="text-xs text-muted-foreground ml-2">{taskCount}</span>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="p-1 rounded-md text-muted-foreground hover:bg-background transition"
            disabled={loading}
          >
            <MoreHorizontal size={15} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={startEditing} className="cursor-pointer">
              <Pencil size={14} />
              {t("renameList")}
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
              disabled={loading}
            >
              <Trash2 size={14} />
              {t("deleteList")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ConfirmModal
        open={confirmDelete}
        title={t("deleteTitle")}
        description={t("deleteDescription", { title: savedTitle })}
        confirmLabel={tCommon("delete")}
        loading={loading}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
