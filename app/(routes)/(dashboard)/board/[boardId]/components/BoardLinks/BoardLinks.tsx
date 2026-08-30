"use client";

import { useEffect, useState } from "react";
import { Link2, Plus, Trash2, ExternalLink, Pencil } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { BoardLinksProps } from "./BoardLinks.types";
import type { BoardLink } from "@/app/api/boards/[boardId]/links/route";

export function BoardLinks({
  boardId,
  isOwner,
  initialLinks,
}: BoardLinksProps) {
  const t = useTranslations("links");
  const tCommon = useTranslations("common");
  const [links, setLinks] = useState<BoardLink[]>(initialLinks);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLinks(initialLinks);
  }, [initialLinks]);

  const save = async (next: BoardLink[]) => {
    setSaving(true);
    const res = await fetch(`/api/boards/${boardId}/links`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    if (res.ok) {
      setLinks(next);
    } else {
      toast.error(t("saveError"));
    }
    setSaving(false);
  };

  const handleAdd = async () => {
    const trimLabel = label.trim();
    const trimUrl = url.trim();
    if (!trimLabel || !trimUrl) return;
    const normalized = trimUrl.startsWith("http")
      ? trimUrl
      : `https://${trimUrl}`;
    const next = [
      ...links,
      { id: crypto.randomUUID(), label: trimLabel, url: normalized },
    ];
    await save(next);
    setLabel("");
    setUrl("");
    setAdding(false);
    toast.success(t("added"));
  };

  const handleDelete = async (id: string) => {
    const next = links.filter((l) => l.id !== id);
    await save(next);
    toast.success(t("deleted"));
  };

  const handleEdit = async (id: string) => {
    const trimLabel = label.trim();
    const trimUrl = url.trim();
    if (!trimLabel || !trimUrl) return;
    const normalized = trimUrl.startsWith("http")
      ? trimUrl
      : `https://${trimUrl}`;
    const next = links.map((l) =>
      l.id === id ? { ...l, label: trimLabel, url: normalized } : l,
    );
    await save(next);
    setEditingId(null);
    setLabel("");
    setUrl("");
    toast.success(t("updated"));
  };

  const startEdit = (link: BoardLink) => {
    setEditingId(link.id);
    setLabel(link.label);
    setUrl(link.url);
    setAdding(false);
  };

  const cancel = () => {
    setAdding(false);
    setEditingId(null);
    setLabel("");
    setUrl("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" className="relative">
            <Link2 size={15} />
            <span className="hidden sm:inline">{t("title")}</span>
            {links.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
                {links.length}
              </span>
            )}
          </Button>
        }
      ></PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">{t("projectLinks")}</p>
          {isOwner && !adding && !editingId && (
            <button
              onClick={() => {
                setAdding(true);
                setEditingId(null);
              }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus size={13} />
              {tCommon("add")}
            </button>
          )}
        </div>

        {/* Form: add or edit */}
        {(adding || editingId) && (
          <div className="flex flex-col gap-2 p-2.5 rounded-lg border border-border bg-muted/40">
            <Input
              placeholder={t("namePlaceholder")}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
            <Input
              placeholder={t("urlPlaceholder")}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  editingId ? handleEdit(editingId) : handleAdd();
                if (e.key === "Escape") cancel();
              }}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={cancel}
                className="h-7 text-xs"
              >
                {tCommon("cancel")}
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  editingId ? handleEdit(editingId) : handleAdd()
                }
                disabled={saving || !label.trim() || !url.trim()}
                className="h-7 text-xs"
              >
                {saving ? tCommon("saving") : editingId ? tCommon("save") : tCommon("add")}
              </Button>
            </div>
          </div>
        )}

        {/* Links list */}
        {links.length === 0 && !adding ? (
          <p className="text-xs text-muted-foreground text-center py-3">
            {isOwner ? t("emptyOwner") : t("empty")}
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {links.map((link) => (
              <li
                key={link.id}
                className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted transition-colors"
              >
                <Link2 size={13} className="text-muted-foreground shrink-0" />
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0 text-sm truncate hover:underline underline-offset-2"
                >
                  {link.label}
                </a>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink size={12} />
                  </a>
                  {isOwner && (
                    <>
                      <button
                        onClick={() => startEdit(link)}
                        className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(link.id)}
                        disabled={saving}
                        className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
