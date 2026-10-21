"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AtSign, Check, MessageSquare, Send, Sparkles, Trash2, Undo2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { mentionHandle } from "@/lib/mentions";
import { CommentItem, TaskCommentsProps } from "./TaskComments.types";
import { CommentsSkeleton } from "@/components/skeletons";
import { useBoardAccess } from "../BoardAccess";

type Candidate = { key: string; handle: string; agent?: boolean };

const MENTION_TOKEN = /(^|\s)@([^\n@]{0,30})$/;
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

function Avatar({ name, agent }: { name: string; agent?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-semibold",
        agent ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
      )}
    >
      {agent ? <Sparkles size={13} /> : initials(name)}
    </span>
  );
}

// Pinta las menciones («@Kiki», «@Nombre») resaltadas dentro del texto del comentario.
function CommentText({ content, handles }: { content: string; handles: string[] }) {
  const pattern = useMemo(() => {
    if (!handles.length) return null;
    const ordered = [...handles].sort((a, b) => b.length - a.length).map(escapeRegExp);
    return new RegExp(`(^|[\\s(])(@(?:${ordered.join("|")}))(?![\\p{L}\\p{N}_])`, "giu");
  }, [handles]);
  if (!pattern) return <>{content}</>;
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of content.matchAll(pattern)) {
    const start = (match.index ?? 0) + match[1].length;
    parts.push(content.slice(last, start));
    parts.push(
      <span key={start} className="font-medium text-primary">
        {match[2]}
      </span>,
    );
    last = start + match[2].length;
  }
  parts.push(content.slice(last));
  return <>{parts}</>;
}

export function TaskComments({ taskId, members = [] }: TaskCommentsProps) {
  const { canEdit } = useBoardAccess();
  const t = useTranslations("task");
  const locale = useLocale();
  const dateFnsLocale = locale === "es" ? es : enUS;
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [value, setValue] = useState("");
  const [caret, setCaret] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pickerDismissed, setPickerDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true); // true = loading until first fetch completes
  // Número de comentarios de Kiki cuando lo mencionamos: mientras no aparezca uno nuevo, está trabajando.
  const [waitingFrom, setWaitingFrom] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const candidates = useMemo<Candidate[]>(
    () => [
      { key: "kiki", handle: "Kiki", agent: true },
      ...members.map((member) => ({ key: member.id, handle: mentionHandle(member) })),
    ],
    [members],
  );
  const handles = useMemo(() => candidates.map((c) => c.handle), [candidates]);

  // Mención en curso: texto tras la última «@» antes del cursor.
  const token = useMemo(() => {
    const match = MENTION_TOKEN.exec(value.slice(0, caret));
    return match ? { query: match[2], start: caret - match[2].length - 1 } : null;
  }, [value, caret]);
  const suggestions = useMemo(() => {
    if (!token || pickerDismissed) return [];
    const query = token.query.toLowerCase();
    return candidates
      .filter((c) => c.handle.toLowerCase().includes(query))
      .sort((a, b) => Number(b.handle.toLowerCase().startsWith(query)) - Number(a.handle.toLowerCase().startsWith(query)))
      .slice(0, 6);
  }, [token, candidates, pickerDismissed]);
  const pickerOpen = canEdit && suggestions.length > 0;
  const selected = Math.min(activeIndex, Math.max(suggestions.length - 1, 0));

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
    const list = listRef.current;
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, [comments, waitingFrom]);

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

  const refresh = async () => {
    const data = await fetch(`/api/tasks/${taskId}/comments`).then((r) => r.json()).catch(() => null);
    if (Array.isArray(data)) setComments(data);
  };

  const applySuggestion = async (commentId: string) => {
    const res = await fetch(`/api/tasks/${taskId}/agent-apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    });
    if (res.ok) toast.success(t("kikiApplied"));
    else toast.error(t("kikiApplyError"));
    await refresh();
  };

  const undo = async (changeId: string) => {
    const res = await fetch(`/api/tasks/${taskId}/agent-undo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ changeId }),
    });
    if (res.ok) {
      toast.success(t("kikiUndone"));
      await refresh();
    } else {
      toast.error(t("kikiUndoError"));
    }
  };

  const resize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 192)}px`;
  };

  // Escribe en el campo y deja el cursor al final del texto nuevo.
  const setText = (text: string, cursor = text.length) => {
    setValue(text);
    setCaret(cursor);
    setPickerDismissed(false);
    setActiveIndex(0);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(cursor, cursor);
      resize();
    });
  };

  const insertMention = (candidate: Candidate) => {
    if (!token) return;
    const before = value.slice(0, token.start);
    const after = value.slice(caret);
    const inserted = `@${candidate.handle} `;
    setText(`${before}${inserted}${after}`, before.length + inserted.length);
  };

  const openMentionPicker = () => {
    const needsSpace = value && !/\s$/.test(value);
    setText(`${value}${needsSpace ? " " : ""}@`);
  };

  const submit = async () => {
    if (!canEdit || loading) return;
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
      setCaret(0);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }
    setLoading(false);
  };

  const deleteComment = async (commentId: string) => {
    const res = await fetch(`/api/tasks/${taskId}/comments/${commentId}`, { method: "DELETE" });
    if (res.ok) setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (pickerOpen) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const step = event.key === "ArrowDown" ? 1 : -1;
        setActiveIndex((selected + step + suggestions.length) % suggestions.length);
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        insertMention(suggestions[selected]);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation(); // no cierra el modal
        setPickerDismissed(true);
        return;
      }
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const quickPrompts = [
    { label: t("kikiChipSummarize"), prompt: t("kikiPromptSummarize") },
    { label: t("kikiChipSubtasks"), prompt: t("kikiPromptSubtasks") },
    { label: t("kikiChipPriority"), prompt: t("kikiPromptPriority") },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <MessageSquare size={15} className="text-muted-foreground" />
        <h3 className="text-sm font-semibold">{t("comments")}</h3>
        {comments.length > 0 && (
          <span className="rounded-full bg-muted px-1.5 text-[11px] font-medium tabular-nums text-muted-foreground">{comments.length}</span>
        )}
      </div>

      <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-4 py-4">
        {fetching && <CommentsSkeleton count={3} />}

        {!fetching && comments.length === 0 && (
          <div className="m-auto flex max-w-60 flex-col items-center gap-2 py-8 text-center">
            <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
              <MessageSquare size={18} />
            </span>
            <p className="text-sm font-medium">{t("noComments")}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{t("emptyCommentsHint")}</p>
          </div>
        )}

        {!fetching &&
          comments.map((c, index) => {
            const previous = comments[index - 1];
            const name = c.user.isAgent ? "Kiki" : c.user.name || c.user.email;
            const grouped =
              previous &&
              previous.user.email === c.user.email &&
              new Date(c.createdAt).getTime() - new Date(previous.createdAt).getTime() < 5 * 60_000;
            return (
              <div key={c.id} className={cn("group flex gap-2.5", grouped ? "mt-0" : "mt-3 first:mt-0")}>
                <div className="w-7 shrink-0">{!grouped && <Avatar name={name} agent={c.user.isAgent} />}</div>
                <div className="min-w-0 flex-1">
                  {!grouped && (
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className="truncate text-xs font-semibold">{name}</span>
                      {c.user.isAgent && (
                        <span className="rounded bg-primary/10 px-1 text-[10px] font-semibold text-primary">{t("kikiAgent")}</span>
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: dateFnsLocale })}
                      </span>
                      {canEdit && (
                        <button
                          onClick={() => deleteComment(c.id)}
                          aria-label={t("deleteComment")}
                          className="ml-auto rounded p-0.5 text-muted-foreground opacity-0 transition-all hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  )}
                  <div
                    className={cn(
                      "min-w-0 whitespace-pre-wrap wrap-break-word rounded-xl border px-3 py-2 text-sm leading-relaxed",
                      c.user.isAgent ? "border-primary/20 bg-primary/5" : "bg-background",
                    )}
                  >
                    <CommentText content={c.content} handles={handles} />
                  </div>
                  {c.suggestion?.pending && !c.change && canEdit && (
                    <button
                      onClick={() => applySuggestion(c.id)}
                      className="mt-1.5 flex w-fit items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      <Check size={12} />
                      {t("kikiApply")}
                    </button>
                  )}
                  {c.change && canEdit && !c.change.reverted && (
                    <button
                      onClick={() => undo(c.change!.id)}
                      className="mt-1.5 flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Undo2 size={12} />
                      {t("kikiUndo")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

        {waiting && (
          <div className="mt-3 flex items-center gap-2.5">
            <Avatar name="Kiki" agent />
            <p className="flex animate-pulse items-center gap-1.5 text-xs text-muted-foreground">{t("kikiThinking")}</p>
          </div>
        )}
      </div>

      {canEdit && (
        <div className="relative border-t bg-background/60 p-3">
          {pickerOpen && (
            <ul
              id={`mention-list-${taskId}`}
              role="listbox"
              aria-label={t("mentionSomeone")}
              className="absolute inset-x-3 bottom-full z-10 mb-1 overflow-hidden rounded-xl border bg-popover p-1 shadow-lg"
            >
              {suggestions.map((candidate, index) => (
                <li
                  key={candidate.key}
                  role="option"
                  aria-selected={index === selected}
                  // mousedown (no click) para no quitarle el foco al campo antes de insertar
                  onMouseDown={(event) => {
                    event.preventDefault();
                    insertMention(candidate);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm",
                    index === selected && "bg-muted",
                  )}
                >
                  <Avatar name={candidate.handle} agent={candidate.agent} />
                  <span className="flex-1 truncate">{candidate.handle}</span>
                  {candidate.agent && <span className="text-[11px] text-muted-foreground">{t("kikiAgentHint")}</span>}
                </li>
              ))}
            </ul>
          )}

          {!value && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {quickPrompts.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setText(`${chip.prompt} `)}
                  className="flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Sparkles size={11} className="text-primary" />
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          <div className="rounded-xl border bg-background transition-shadow focus-within:ring-2 focus-within:ring-ring/40">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setCaret(event.target.selectionStart);
                setPickerDismissed(false);
                setActiveIndex(0);
                resize();
              }}
              onSelect={(event) => setCaret(event.currentTarget.selectionStart)}
              onKeyDown={onKeyDown}
              placeholder={t("kikiHintPlaceholder")}
              rows={2}
              disabled={loading}
              role="combobox"
              aria-expanded={pickerOpen}
              aria-controls={`mention-list-${taskId}`}
              aria-autocomplete="list"
              aria-haspopup="listbox"
              className="block max-h-48 min-h-16 w-full resize-none bg-transparent px-3 pt-2.5 text-sm outline-none placeholder:text-muted-foreground"
            />
            <div className="flex items-center gap-1 px-2 pb-2">
              <button
                type="button"
                onClick={openMentionPicker}
                title={t("mentionSomeone")}
                aria-label={t("mentionSomeone")}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <AtSign size={15} />
              </button>
              <button
                type="button"
                onClick={() => setText(value && !/\s$/.test(value) ? `${value} @Kiki ` : `${value}@Kiki `)}
                title={t("kikiInsert")}
                aria-label={t("kikiInsert")}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
              >
                <Sparkles size={15} />
              </button>
              <span className="ml-auto hidden pr-1 text-[11px] text-muted-foreground lg:inline">{t("commentHint")}</span>
              <button
                type="button"
                onClick={submit}
                disabled={loading || !value.trim()}
                aria-label={t("send")}
                className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
