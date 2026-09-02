"use client";

import { useState, useRef } from "react";
import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useBoardStore } from "../../store/useBoardStore";
import { CreateListFormProps } from "./CreateListForm.types";

export function CreateListForm({ boardId }: CreateListFormProps) {
  const t = useTranslations("board");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const addList = useBoardStore((s) => s.addList);
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
      const res = await fetch("/api/lists/createList", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, boardId }),
      });

      if (res.ok) {
        const list = await res.json();
        addList({ ...list, tasks: [] });
        handleClose();
      } else {
        toast.error(t("createListError"));
      }
    } catch {
      toast.error(t("createListError"));
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        data-guide="add-list"
        onClick={handleOpen}
        className="flex items-center gap-2 bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl w-64 shrink-0 p-3 text-sm font-medium transition-colors cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        {t("addList")}
      </button>
    );
  }

  return (
    <div className="bg-muted rounded-xl w-64 shrink-0 p-3 flex flex-col gap-2">
      <Input
        ref={inputRef}
        placeholder={t("addListPlaceholder")}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") handleClose();
        }}
      />
      <div className="flex items-center gap-1">
        <Button size="sm" onClick={handleSubmit} disabled={!title.trim() || loading} className="cursor-pointer">
          {loading ? t("adding") : t("add")}
        </Button>
        <Button size="icon" variant="ghost" onClick={handleClose} className="cursor-pointer">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
