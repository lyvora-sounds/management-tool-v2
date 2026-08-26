"use client";

import { useState, useRef } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useBoardStore } from "../../store/useBoardStore";
import { CreateTaskFormProps } from "./CreateTaskForm.types";

export function CreateTaskForm({ listId }: CreateTaskFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const addTask = useBoardStore((s) => s.addTask);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleClose = () => {
    setOpen(false);
    setTitle("");
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/tasks/createTask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, listId }),
      });

      if (res.ok) {
        const task = await res.json();
        addTask(listId, { ...task, labels: [], collaborators: [], assignee: null, qa: null });
        handleClose();
      } else {
        toast.error("Error al crear la tarea");
      }
    } catch {
      toast.error("Error al crear la tarea");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 w-full text-muted-foreground hover:text-foreground hover:bg-background/60 rounded-lg px-2 py-1.5 text-xs transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Añadir tarea
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        ref={inputRef}
        placeholder="Nombre de la tarea"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") handleClose();
        }}
        className="text-sm"
      />
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!title.trim() || loading}
        >
          {loading ? "Añadiendo..." : "Añadir"}
        </Button>
        <Button size="icon" variant="ghost" onClick={handleClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
