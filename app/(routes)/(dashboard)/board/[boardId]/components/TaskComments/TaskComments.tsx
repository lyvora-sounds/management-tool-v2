"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { CommentItem, TaskCommentsProps } from "./TaskComments.types";
import { CommentsSkeleton } from "@/components/skeletons";
import { useBoardAccess } from "../BoardAccess";

export function TaskComments({ taskId }: TaskCommentsProps) {
  const { canEdit } = useBoardAccess();
  const t = useTranslations("task");
  const locale = useLocale();
  const dateFnsLocale = locale === "es" ? es : enUS;
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true); // true = loading until first fetch completes
  // Número de comentarios de Kiki cuando lo mencionamos: mientras no aparezca uno nuevo, está trabajando.
  const [waitingFrom, setWaitingFrom] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch(`/api/tasks/${taskId}/comments`)
      .then((r) => r.json())
      .then((data) => {
        setComments(Array.isArray(data) ? data : []);
        setFetching(false);
      })
      .catch(() => setFetching(false));
  }, [taskId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const kikiCount = comments.filter((c) => c.user.isAgent).length;
  const waiting = waitingFrom !== null && kikiCount <= waitingFrom;

  // Kiki responde en segundo plano: se consulta el hilo hasta que llega su comentario (máx. ~75 s).
  useEffect(() => {
    if (!waiting) return;
    let tries = 0;
    const timer = setInterval(async () => {
      tries += 1;
      if (tries > 30) {
        setWaitingFrom(null);
        return;
      }
      const data = await fetch(`/api/tasks/${taskId}/comments`).then((r) => r.json()).catch(() => null);
      if (Array.isArray(data)) setComments(data);
    }, 2500);
    return () => clearInterval(timer);
  }, [waiting, taskId]);

  const undo = async (changeId: string) => {
    const res = await fetch(`/api/tasks/${taskId}/agent-undo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ changeId }),
    });
    if (res.ok) {
      toast.success(t("kikiUndone"));
      const data = await fetch(`/api/tasks/${taskId}/comments`).then((r) => r.json()).catch(() => null);
      if (Array.isArray(data)) setComments(data);
    } else {
      toast.error(t("kikiUndoError"));
    }
  };

  const submit = async () => {
    if (!canEdit) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    setLoading(true);
    const res = await fetch(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: trimmed }),
    });
    if (res.ok) {
      const comment = await res.json();
      setComments((prev) => [...prev, comment]);
      if (/(^|[\s(])@kiki\b/i.test(trimmed)) setWaitingFrom(kikiCount);
      setValue("");
      if (textareaRef.current) textareaRef.current.style.height = "24px";
    }
    setLoading(false);
  };

  const deleteComment = async (commentId: string) => {
    const res = await fetch(`/api/tasks/${taskId}/comments/${commentId}`, { method: "DELETE" });
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <p className="text-xs font-medium text-muted-foreground mb-3">{t("comments")}</p>

      {/* List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
        {fetching && <CommentsSkeleton count={3} />}
        {!fetching && comments.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">
            {t("noComments")}
          </p>
        )}
        {!fetching && comments.map((c) => (
          <div key={c.id} className="group flex flex-col gap-0.5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 text-xs font-medium">
                {c.user.isAgent && <Sparkles size={11} className="text-primary" />}
                {c.user.isAgent ? "Kiki" : c.user.name || c.user.email}
                {c.user.isAgent && (
                  <span className="rounded bg-primary/10 px-1 text-[10px] font-semibold text-primary">{t("kikiAgent")}</span>
                )}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(c.createdAt), {
                    addSuffix: true,
                    locale: dateFnsLocale,
                  })}
                </span>
                {canEdit && <button
                  onClick={() => deleteComment(c.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 size={11} />
                </button>}
              </div>
            </div>
            <p className={`text-sm rounded-lg px-3 py-2 whitespace-pre-wrap wrap-break-word min-w-0 ${c.user.isAgent ? "bg-primary/10" : "bg-muted"}`}>{c.content}</p>
            {c.change && canEdit && !c.change.reverted && (
              <button
                onClick={() => undo(c.change!.id)}
                className="mt-0.5 flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Undo2 size={11} />
                {t("kikiUndo")}
              </button>
            )}
          </div>
        ))}
        {waiting && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse">
            <Sparkles size={12} className="text-primary" />
            {t("kikiThinking")}
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {canEdit && <div className="mt-3 flex gap-2 items-end border rounded-xl px-3 py-2 focus-within:ring-1 focus-within:ring-ring">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 72)}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={t("kikiHintPlaceholder")}
          rows={1}
          disabled={loading}
          style={{ height: "24px" }}
          className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground overflow-y-auto"
        />
        <button
          type="button"
          onClick={() => {
            setValue((v) => (v && !v.endsWith(" ") ? `${v} @Kiki ` : `${v}@Kiki `));
            textareaRef.current?.focus();
          }}
          title={t("kikiInsert")}
          aria-label={t("kikiInsert")}
          className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
        >
          <Sparkles size={15} />
        </button>
        <button
          onClick={submit}
          disabled={loading || !value.trim()}
          className="shrink-0 text-muted-foreground hover:text-primary transition-colors disabled:opacity-40"
        >
          <Send size={15} />
        </button>
      </div>}
    </div>
  );
}
