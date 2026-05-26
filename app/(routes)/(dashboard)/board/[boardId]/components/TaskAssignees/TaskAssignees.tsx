"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Props } from "./TaskAssignees.types";
import type { BoardUser } from "../TaskCard/TaskCard.types";


function getInitials(name: string | null, email: string) {
  if (name) return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return email[0].toUpperCase();
}

export function TaskAssignees({ taskId, boardUsers, activeAssignees, isOwner, memberCanAssign, onAssigneesChange }: Props) {
  const [open, setOpen] = useState(false);
  const [activeIds, setActiveIds] = useState<Set<string>>(
    new Set(activeAssignees.map((a) => a.user.id))
  );

  const toggle = async (user: BoardUser) => {
    const next = new Set(activeIds);
    next.has(user.id) ? next.delete(user.id) : next.add(user.id);
    setActiveIds(next);

    const nextAssignees = boardUsers
      .filter((u) => next.has(u.id))
      .map((u) => ({ user: u }));
    onAssigneesChange(nextAssignees);

    await fetch(`/api/tasks/${taskId}/assignees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeId: user.id }),
    });
  };

  const assigned = boardUsers.filter((u) => activeIds.has(u.id));

  if (!isOwner && !memberCanAssign) {
    if (assigned.length === 0) return null;
    return (
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {assigned.map((u) => (
            <div
              key={u.id}
              title={u.name ?? u.email}
              className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center ring-2 ring-background"
            >
              {getInitials(u.name, u.email)}
            </div>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          {assigned.map((u) => u.name ?? u.email).join(", ")}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger render={
            <Button variant="outline" size="sm">
              <Users size={14} />
              Asignar
            </Button>
          } />
          <PopoverContent className="w-56 flex flex-col gap-1 p-2">
            <p className="text-xs font-medium text-muted-foreground px-1 pb-1">Miembros del board</p>
            {boardUsers.length === 0 && (
              <p className="text-xs text-muted-foreground px-1">No hay miembros aún</p>
            )}
            {boardUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => toggle(user)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted transition-colors w-full text-left"
              >
                <Checkbox
                  checked={activeIds.has(user.id)}
                  readOnly
                  className="pointer-events-none shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm truncate">{user.name ?? user.email}</p>
                  {user.name && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
                </div>
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {assigned.length > 0 && (
          <div className="flex -space-x-2">
            {assigned.map((u) => (
              <div
                key={u.id}
                title={u.name ?? u.email}
                className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center ring-2 ring-background"
              >
                {getInitials(u.name, u.email)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
