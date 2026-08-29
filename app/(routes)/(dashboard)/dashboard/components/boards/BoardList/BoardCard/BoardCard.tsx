"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, ExternalLink, Pencil, Trash2, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useBoardsStore } from "@/store/useBoardsStore";
import { formatRelativeTime } from "@/lib/i18nFormat";
import { BoardCardProps } from "./BoardCard.types";
import { ConfirmModal } from "@/components/Shared/ModalDeleteConfirmation/ModalDeleteConfirmation";

export function BoardCard({ board }: BoardCardProps) {
  const { id, title, color, updatedAt, isOwner, totalTasks, completedTasks, totalLists } = board;
  const t = useTranslations();
  const tBoards = useTranslations("boards");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const renameBoard = useBoardsStore((s) => s.renameBoard);
  const removeBoard = useBoardsStore((s) => s.removeBoard);

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(title);
  const [currentTitle, setCurrentTitle] = useState(title);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const pct = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const initial = currentTitle.charAt(0).toUpperCase();
  const hasColor = !!color;
  const textColor = hasColor ? "text-white" : "text-foreground";
  const mutedTextColor = hasColor ? "text-white/70" : "text-muted-foreground";

  const saveRename = async () => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === currentTitle) {
      setRenameValue(currentTitle);
      setIsRenaming(false);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/boards/updateBoard/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed }),
    });
    if (res.ok) {
      renameBoard(id, trimmed);
      setCurrentTitle(trimmed);
      toast.success(tBoards("renamed"));
    } else {
      setRenameValue(currentTitle);
      toast.error(tBoards("renameError"));
    }
    setIsRenaming(false);
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    const res = await fetch(`/api/boards/deleteBoard/${id}`, { method: "DELETE" });
    if (res.ok) {
      removeBoard(id);
      router.refresh();
      toast.success(tBoards("deleted"));
    } else {
      toast.error(tBoards("deleteError"));
      setLoading(false);
    }
  };

  return (
    <div
      className="group relative flex flex-col rounded-xl border overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={hasColor ? { backgroundColor: color! } : undefined}
    >
      {/* Header */}
      <div className={`flex items-start justify-between p-4 pb-3 ${!hasColor ? "bg-muted/40" : ""}`}>
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center text-base font-bold shrink-0 ${
            hasColor ? "bg-white/20 text-white" : "bg-background text-foreground"
          }`}
        >
          {initial}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isOwner && (
            <Badge
              variant="secondary"
              className={`text-[10px] px-1.5 py-0 h-5 ${hasColor ? "bg-white/20 text-white border-0" : ""}`}
            >
              <Users size={9} className="mr-1" />
              {tBoards("member")}
            </Badge>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className={`rounded-md p-1 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 ${
                hasColor
                  ? "text-white/70 hover:text-white hover:bg-white/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              disabled={loading}
            >
              <MoreHorizontal size={15} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => router.push(`/board/${id}`)}>
                <ExternalLink size={14} />
                {tBoards("open")}
              </DropdownMenuItem>
              {isOwner && (
                <>
                  <DropdownMenuItem onClick={() => { setRenameValue(currentTitle); setIsRenaming(true); }}>
                    <Pencil size={14} />
                    {tBoards("rename")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)} disabled={loading}>
                    <Trash2 size={14} />
                    {tBoards("delete")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Title + meta — clickable area */}
      <Link href={`/board/${id}`} className="group flex-1 flex flex-col">
        <div className="px-4 pb-3 flex flex-col gap-1">
          {isRenaming ? (
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={saveRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveRename();
                if (e.key === "Escape") { setRenameValue(currentTitle); setIsRenaming(false); }
              }}
              onClick={(e) => e.preventDefault()}
              autoFocus
              disabled={loading}
              className="h-7 text-sm font-semibold px-1 py-0"
            />
          ) : (
            <h3 className={`font-semibold text-sm leading-tight line-clamp-2 ${textColor}`}>
              {currentTitle}
            </h3>
          )}
          <p className={`text-xs ${mutedTextColor}`}>
            {tBoards("listTaskMeta", { lists: totalLists, tasks: totalTasks })}
          </p>
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-4 flex flex-col gap-1.5 mt-auto">
          <div className={`w-full h-1.5 rounded-full overflow-hidden ${hasColor ? "bg-white/25" : "bg-muted"}`}>
            <div
              className={`h-full rounded-full transition-all ${hasColor ? "bg-white" : "bg-primary"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className={`flex items-center justify-between text-[10px] ${mutedTextColor}`}>
            <span>{tBoards("completedShort", { done: completedTasks, total: totalTasks })}</span>
            <span>{formatRelativeTime(updatedAt, t, locale)}</span>
          </div>
        </div>
      </Link>
      <ConfirmModal
        open={confirmDelete}
        title={tBoards("deleteTitle")}
        description={tBoards("deleteDescription", { title: currentTitle })}
        confirmLabel={tCommon("delete")}
        loading={loading}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
