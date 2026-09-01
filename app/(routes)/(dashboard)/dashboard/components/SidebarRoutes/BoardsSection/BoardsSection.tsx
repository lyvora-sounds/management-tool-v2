"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Kanban, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBoardsStore } from "@/store/useBoardsStore";

export function BoardsSection() {
  const t = useTranslations("sidebar");
  const [open, setOpen] = useState(true);
  const pathname = usePathname();
  const boards = useBoardsStore((s) => s.boards);
  const ownUserId = useBoardsStore((s) => s.ownUserId);

  const ownBoards = boards.filter((b) => b.userId === ownUserId);
  const memberBoards = boards.filter((b) => b.userId !== ownUserId);

  const renderBoard = (board: (typeof boards)[0]) => {
    const isActive = pathname === `/board/${board.id}`;
    return (
      <Link
        key={board.id}
        href={`/board/${board.id}`}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition truncate",
          isActive ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted"
        )}
      >
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: board.color ?? "#94a3b8" }}
        />
        <span className="truncate">{board.title}</span>
      </Link>
    );
  };

  return (
    <div className="flex flex-col gap-1">
      <div
        className={cn(
          "flex items-center rounded-md text-sm transition",
          pathname === "/dashboard/boards"
            ? "bg-muted font-medium"
            : "text-muted-foreground hover:bg-muted"
        )}
      >
        <Link
          href="/dashboard/boards"
          className="flex items-center gap-2 flex-1 px-3 py-2"
        >
          <Kanban size={18} />
          {t("boards")}
        </Link>
        <button
          onClick={() => setOpen((o) => !o)}
          className="pr-3 py-2 text-muted-foreground cursor-pointer"
        >
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-0.5 pl-4">
          {boards.length === 0 && (
            <p className="text-xs text-muted-foreground px-3 py-1">
              {t("noBoardsYet")}
            </p>
          )}

          {ownBoards.length > 0 && (
            <>
              <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider px-3 pt-1 pb-0.5">
                {t("myBoards")}
              </p>
              {ownBoards.map(renderBoard)}
            </>
          )}

          {memberBoards.length > 0 && (
            <>
              <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider px-3 pt-2 pb-0.5">
                {t("shared")}
              </p>
              {memberBoards.map(renderBoard)}
            </>
          )}
        </div>
      )}
    </div>
  );
}
