"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Notification } from "./NotificationBell.types";

const POLL_INTERVAL = 30_000; // 30 seconds

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return;
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data);
    } catch {
      // silently ignore network errors during polling
    }
  }, []);

  useEffect(() => {
    const initial = setTimeout(fetchNotifications, 0);
    intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL);

    const onFocusOrVisible = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        fetchNotifications();
      }
    };

    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);

    return () => {
      clearTimeout(initial);
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
    };
  }, [fetchNotifications]);

  const markAllRead = async () => {
    const prev = notifications;
    setNotifications([]);
    const res = await fetch("/api/notifications", { method: "PATCH" });
    if (!res.ok) setNotifications(prev);
  };

  const markOneRead = async (id: string) => {
    const prev = notifications;
    setNotifications((p) => p.filter((n) => n.id !== id));
    const res = await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    if (!res.ok) setNotifications(prev);
  };

  const unreadCount = notifications.length;

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" className="relative">
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80 p-0 flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="text-sm font-medium">Notificaciones</span>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Marcar todas como leídas
            </button>
          )}
        </div>

        <div className="overflow-y-auto max-h-80 flex flex-col divide-y">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Sin notificaciones nuevas
            </p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => markOneRead(n.id)}
                className={cn(
                  "flex flex-col gap-0.5 px-3 py-2.5 text-left hover:bg-muted transition-colors w-full",
                  !n.read && "bg-primary/5"
                )}
              >
                <span className="text-sm leading-snug">{n.message}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(n.createdAt).toLocaleString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </button>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="border-t px-3 py-2">
            <Badge variant="secondary" className="text-xs">
              {unreadCount} sin leer
            </Badge>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
