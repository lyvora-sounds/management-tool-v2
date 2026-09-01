"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, LayoutDashboard } from "lucide-react";
import { useTranslations } from "next-intl";
import { Board, RecentBoardsProps } from "./RecentBoards.types";

const STORAGE_KEY = "recent_boards";

export function RecentBoards({ boards }: RecentBoardsProps) {
  const t = useTranslations("dashboard");
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        setRecentIds(raw ? JSON.parse(raw) : []);
      } catch {
        setRecentIds([]);
      }
      setMounted(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  if (!mounted) return null;

  const recentBoards = recentIds
    .map((id) => boards.find((b) => b.id === id))
    .filter(Boolean) as Board[];

  if (recentBoards.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Clock size={15} className="text-muted-foreground" />
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("recentlyVisited")}
        </h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {recentBoards.map((board) => (
          <Link
            key={board.id}
            href={`/board/${board.id}`}
            className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            {board.color ? (
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: board.color }}
              />
            ) : (
              <LayoutDashboard
                size={13}
                className="text-muted-foreground shrink-0"
              />
            )}
            <span className="truncate max-w-32">{board.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
