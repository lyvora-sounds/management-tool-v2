"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { useRouter } from "next/navigation";
import {
  AlignLeft,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Paperclip,
  Share2,
  Layers,
  Calendar,
  Globe,
  MessageSquare,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { readCommentsPanel, resolveCommentsOpen, writeCommentsPanel } from "@/lib/commentsPanel";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useBoardStore } from "../../store/useBoardStore";
import { TaskDatePicker } from "../TaskDatePicker/TaskDatePicker";
import { TaskLabels } from "../TaskLabels/TaskLabels";
import { TaskComments } from "../TaskComments/TaskComments";
import {
  TaskAttachments,
  type TaskAttachmentsHandle,
} from "../TaskAttachments/TaskAttachments";
import { TaskDescriptionEditor } from "../TaskDescriptionEditor/TaskDescriptionEditor";
import { TaskAssignee } from "../TaskAssignee/TaskAssignee";
import { TaskCollaborators } from "../TaskCollaborators/TaskCollaborators";
import { TaskQa } from "../TaskQa/TaskQa";
import { TaskReporter } from "../TaskReporter/TaskReporter";
import { TaskSubtasks } from "../TaskSubtasks/TaskSubtasks";
import { TaskPriority } from "../TaskPriority/TaskPriority";
import { TaskAiImprove } from "../TaskAiImprove/TaskAiImprove";
import { TaskShareModal } from "../TaskShareModal/TaskShareModal";
import { TaskCustomFields } from "../TaskCustomFields/TaskCustomFields";
import { TaskHierarchy } from "../TaskHierarchy/TaskHierarchy";
import { FieldGroupInfoHint } from "../FieldGroupInfoHint/FieldGroupInfoHint";
import { hierarchyNodesFromLists } from "../TaskHierarchy/hierarchyNodes";
import type { Priority } from "../TaskPriority/TaskPriority.constants";
import type { LabelModel } from "@/lib/modelTypes";
import type { BoardUser, TaskCollaborator } from "../TaskCard/TaskCard.types";
import { TaskModalProps } from "./TaskModal.types";
import { toast } from "sonner";
import { TaskDevelopment } from "./TaskDevelopment";
import { formatTicketDescriptionHtml } from "@/lib/ticketDescriptionHtml";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { getStatusTheme, isDoneList, targetListForCompletion } from "@/lib/statusTheme";
import { useBoardAccess } from "../BoardAccess";
import {
  assignmentMismatch,
  formatQuarterOptionLabel,
  toQuarterRanges,
  type BoardQuarterDto,
} from "@/lib/boardQuarters";

type DescriptionLanguage = "en" | "es" | "tl";

/** True when a key press is going into a text field, so a one-letter shortcut must leave it alone. */
function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName);
}

export function TaskModal({
  task,
  listId,
  listTitle,
  boardId,
  open,
  onClose,
  canManage,
  boardUsers,
  memberCanAssign,
  boardQuarters = [],
}: TaskModalProps) {
  const { canEdit } = useBoardAccess();
  const locale = useLocale();
  const t = useTranslations("task");
  const tBoard = useTranslations("board");
  const tCommon = useTranslations("common");
  const tQuarters = useTranslations("quarters");
  const lists = useBoardStore((s) => s.lists);
  const updateTask = useBoardStore((s) => s.updateTask);
  const addSubtask = useBoardStore((s) => s.addSubtask);
  const moveTask = useBoardStore((s) => s.moveTask);
  const attachmentsRef = useRef<TaskAttachmentsHandle>(null);
  const router = useRouter();
  const hierarchyNodes = useMemo(() => hierarchyNodesFromLists(lists), [lists]);

  // Flat list of all tasks across all lists for navigation
  const allTasks =
    lists.length > 0
      ? lists.flatMap((l) =>
          l.tasks.map((t) => ({ task: t, listId: l.id, listTitle: l.title })),
        )
      : [{ task, listId, listTitle }];

  // Current navigation state — starts at the task that opened the modal
  const [currentTask, setCurrentTask] = useState(task);
  const [currentListId, setCurrentListId] = useState(listId);
  const [currentListTitle, setCurrentListTitle] = useState(listTitle);

  useEffect(() => {
    if (task) {
      setCurrentTask(task);
      setCurrentListId(listId);
      setCurrentListTitle(listTitle);
    }
  }, [task, listId, listTitle]);

  const currentIndex = allTasks.findIndex((e) => e.task.id === currentTask.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allTasks.length - 1;

  // Local editing state — all initialized from currentTask
  const [title, setTitle] = useState(currentTask.title);
  const [savedTitle, setSavedTitle] = useState(currentTask.title);
  const [savedDescription, setSavedDescription] = useState(
    currentTask.description ?? "",
  );
  const [completed, setCompleted] = useState(currentTask.completed);
  const [currentStartDate, setCurrentStartDate] = useState<Date | null>(
    currentTask.startDate ?? null,
  );
  const [currentDueDate, setCurrentDueDate] = useState<Date | null>(
    currentTask.dueDate ?? null,
  );
  const [activeLabels, setActiveLabels] = useState<{ label: LabelModel }[]>(
    currentTask.labels,
  );
  const [assignee, setAssignee] = useState<BoardUser | null | undefined>(
    currentTask.assignee,
  );
  const [qa, setQa] = useState<BoardUser | null | undefined>(
    currentTask.qa,
  );
  const [reporter, setReporter] = useState<BoardUser | null | undefined>(
    currentTask.reporter,
  );
  const [collaborators, setCollaborators] = useState<TaskCollaborator[]>(
    currentTask.collaborators ?? [],
  );
  const [priority, setPriority] = useState<Priority | null>(
    (currentTask.priority as Priority) ?? null,
  );
  const [currentEpicId, setCurrentEpicId] = useState<string | null>(
    currentTask.epicId ?? null,
  );
  const [currentQuarter, setCurrentQuarter] = useState<string>(
    currentTask.quarter ?? "",
  );
  const [descriptionLanguage, setDescriptionLanguage] =
    useState<DescriptionLanguage>(
      locale === "es" || locale === "tl" ? locale : "en",
    );
  const [epics, setEpics] = useState<{ id: string; title: string; color: string }[]>([]);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<"details" | "comments">("details");

  // Comments panel on wide screens. The person's explicit choice wins for every ticket; without one it is open
  // only when the ticket has comments. On phones and tablets comments are the "Comentarios" tab instead.
  const [panelChoice, setPanelChoice] = useState<string | null>(() =>
    typeof window === "undefined" ? null : readCommentsPanel(),
  );
  const [liveCounts, setLiveCounts] = useState<Record<string, number>>({});
  const storeCommentCount = currentTask._count?.comments ?? 0;
  const commentCount = liveCounts[currentTask.id] ?? storeCommentCount;
  const commentsOpen = resolveCommentsOpen(panelChoice, commentCount);
  // How many comments the person had seen when they opened this ticket or last toggled the panel: a dot shows on the
  // header button when the count grows while the panel is collapsed. Reset when the ticket changes (state adjusted
  // while rendering, which React allows, rather than in an effect).
  const [seen, setSeen] = useState({ id: currentTask.id, count: storeCommentCount });
  if (seen.id !== currentTask.id) setSeen({ id: currentTask.id, count: storeCommentCount });
  const toggleComments = useCallback(() => {
    const next = !commentsOpen;
    setPanelChoice(next ? "1" : "0");
    setSeen({ id: currentTask.id, count: commentCount });
    writeCommentsPanel(next);
  }, [commentsOpen, currentTask.id, commentCount]);
  const handleCountChange = useCallback(
    (count: number) => setLiveCounts((prev) => (prev[currentTask.id] === count ? prev : { ...prev, [currentTask.id]: count })),
    [currentTask.id],
  );
  const hasNewComments = !commentsOpen && seen.id === currentTask.id && storeCommentCount > seen.count;

  // Load board Epics
  useEffect(() => {
    if (open) {
      apiFetch(`/api/boards/${boardId}/epics`)
        .then((res) => res.json())
        .then((data) => setEpics(data.epics || []))
        .catch(() => {});
    }
  }, [open, boardId]);

  // Reset all local state when navigating to a different task
  useEffect(() => {
    const t = setTimeout(() => {
      setTitle(currentTask.title);
      setSavedTitle(currentTask.title);
      setSavedDescription(currentTask.description ?? "");
      setCompleted(currentTask.completed);
      setCurrentStartDate(currentTask.startDate ?? null);
      setCurrentDueDate(currentTask.dueDate ?? null);
      setActiveLabels(currentTask.labels);
      setAssignee(currentTask.assignee);
      setQa(currentTask.qa);
      setReporter(currentTask.reporter);
      setCollaborators(currentTask.collaborators ?? []);
      setPriority((currentTask.priority as Priority) ?? null);
      setCurrentEpicId(currentTask.epicId ?? null);
      setCurrentQuarter(currentTask.quarter ?? "");
      setEditingTitle(false);
      setEditingDescription(false);
    }, 0);
    return () => clearTimeout(t);
  }, [currentTask.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = (index: number) => {
    const entry = allTasks[index];
    if (!entry) return;
    setCurrentTask(entry.task);
    setCurrentListId(entry.listId);
    setCurrentListTitle(entry.listTitle);
  };

  // Keyboard navigation (← →) when not editing text
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (editingTitle || editingDescription) return;
      if (
        (e.key === "c" || e.key === "C") &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !isTypingTarget(e.target) &&
        window.matchMedia("(min-width: 640px)").matches
      ) {
        e.preventDefault();
        toggleComments();
        return;
      }
      if (e.key === "ArrowLeft" && hasPrev) {
        const entry = allTasks[currentIndex - 1];
        if (entry) {
          setCurrentTask(entry.task);
          setCurrentListId(entry.listId);
          setCurrentListTitle(entry.listTitle);
        }
      }
      if (e.key === "ArrowRight" && hasNext) {
        const entry = allTasks[currentIndex + 1];
        if (entry) {
          setCurrentTask(entry.task);
          setCurrentListId(entry.listId);
          setCurrentListTitle(entry.listTitle);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    open,
    editingTitle,
    editingDescription,
    hasPrev,
    hasNext,
    currentIndex,
    allTasks,
    toggleComments,
  ]);

  const handleMoveToList = async (targetListId: string) => {
    if (!canEdit) return;
    if (targetListId === currentListId) return;
    const targetList = lists.find((l) => l.id === targetListId);
    if (!targetList) return;

    const isDone = isDoneList(targetList.title);
    moveTask(
      currentTask.id,
      currentListId,
      targetListId,
      targetList.tasks.length,
    );
    setCurrentListId(targetListId);
    setCurrentListTitle(targetList.title);
    if (isDone !== completed) {
      setCompleted(isDone);
      updateTask(targetListId, currentTask.id, { completed: isDone });
    }

    try {
      const res = await apiFetch(`/api/tasks/updateTask/${currentTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId: targetListId }),
      });
      if (res.ok) {
        toast.success(t("movedTo", { title: targetList.title }));
      } else {
        toast.error(t("moveError"));
      }
    } catch {
      toast.error(t("moveError"));
    }
  };

  const toggleCompleted = async () => {
    if (!canEdit) return;
    const next = !completed;
    const targetList = targetListForCompletion(lists, currentListId, next);

    if (targetList) {
      moveTask(
        currentTask.id,
        currentListId,
        targetList.id,
        targetList.tasks.length,
      );
      setCurrentListId(targetList.id);
      setCurrentListTitle(targetList.title);
      setCompleted(next);
      updateTask(targetList.id, currentTask.id, { completed: next });

      const res = await apiFetch(`/api/tasks/updateTask/${currentTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId: targetList.id, completed: next }),
      });
      if (res.ok) {
        toast.success(
          next
            ? t("completedAndMoved", { title: targetList.title })
            : t("reopenedAndMoved", { title: targetList.title }),
        );
      }
    } else {
      setCompleted(next);
      updateTask(currentListId, currentTask.id, { completed: next });
      const res = await apiFetch(`/api/tasks/updateTask/${currentTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: next }),
      });
      if (res.ok) {
        toast.success(next ? t("completed") : t("reopened"));
      }
    }
  };

  const saveTitle = async () => {
    if (!canEdit) return;
    const trimmed = title.trim();
    if (!trimmed || trimmed === savedTitle) {
      setTitle(savedTitle);
      return;
    }
    setLoading(true);
    const res = await apiFetch(`/api/tasks/updateTask/${currentTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed }),
    });
    if (res.ok) {
      updateTask(currentListId, currentTask.id, { title: trimmed });
      setSavedTitle(trimmed);
      toast.success(t("titleUpdated"));
    } else {
      setTitle(savedTitle);
      toast.error(t("titleUpdateError"));
    }
    setLoading(false);
  };

  const saveDescription = async (html: string) => {
    if (!canEdit) return;
    if (html === savedDescription) {
      setEditingDescription(false);
      return;
    }
    setLoading(true);
    const res = await apiFetch(`/api/tasks/updateTask/${currentTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: html }),
    });
    if (res.ok) {
      updateTask(currentListId, currentTask.id, { description: html || null });
      setSavedDescription(html);
      toast.success(t("descriptionSaved"));
    } else {
      toast.error(t("descriptionSaveError"));
    }
    setEditingDescription(false);
    setLoading(false);
  };

  const saveEpic = async (epicId: string | null) => {
    if (!canEdit) return;
    setCurrentEpicId(epicId);
    await apiFetch(`/api/tasks/updateTask/${currentTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ epicId }),
    });
    updateTask(currentListId, currentTask.id, { epicId });
  };

  const quarterCalendar = useMemo(() => toQuarterRanges(boardQuarters), [boardQuarters]);

  const quarterSelectOptions = useMemo(() => {
    const byKey = new Map<string, BoardQuarterDto>(
      boardQuarters.map((quarter) => [quarter.key, quarter]),
    );
    if (currentQuarter && !byKey.has(currentQuarter)) {
      byKey.set(currentQuarter, {
        key: currentQuarter,
        startDate: "",
        endDate: "",
      });
    }
    return [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key));
  }, [boardQuarters, currentQuarter]);

  const assertQuarterDates = (
    quarterKey: string | null | undefined,
    dates: { startDate?: Date | null; dueDate?: Date | null },
  ) => {
    const result = assignmentMismatch(quarterKey, dates, quarterCalendar);
    if (result === "unknown") {
      toast.error(tQuarters("unknownQuarter"));
      return false;
    }
    if (result === "mismatch") {
      toast.error(tQuarters("dateMismatch"));
      return false;
    }
    return true;
  };

  const saveQuarter = async (quarterVal: string) => {
    if (!canEdit) return;
    const next = quarterVal === "none" ? "" : quarterVal.trim();
    if (
      !assertQuarterDates(next || null, {
        startDate: currentStartDate,
        dueDate: currentDueDate,
      })
    ) {
      return;
    }
    const previous = currentQuarter;
    setCurrentQuarter(next);
    const res = await apiFetch(`/api/tasks/updateTask/${currentTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quarter: next || null }),
    });
    if (!res.ok) {
      setCurrentQuarter(previous);
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      toast.error(body?.message || tQuarters("unknownQuarter"));
      return;
    }
    updateTask(currentListId, currentTask.id, { quarter: next || null });
  };

  const handleAiApply = async (
    newTitle: string,
    newDescription: string,
    acceptedSubtasks: string[],
  ) => {
    if (!canEdit) return;
    // 1. Update title & description
    if (newTitle && newTitle !== savedTitle) {
      setTitle(newTitle);
      setSavedTitle(newTitle);
    }
    if (newDescription && newDescription !== savedDescription) {
      setSavedDescription(newDescription);
    }

    await apiFetch(`/api/tasks/updateTask/${currentTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle || savedTitle,
        description: newDescription || savedDescription,
      }),
    });
    updateTask(currentListId, currentTask.id, {
      title: newTitle || savedTitle,
      description: newDescription || savedDescription,
    });

    // 2. Add accepted subtasks
    for (const subTitle of acceptedSubtasks) {
      try {
        const res = await apiFetch(`/api/tasks/${currentTask.id}/subtasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: subTitle }),
        });
        if (res.ok) {
          const newSub = await res.json();
          addSubtask(currentListId, currentTask.id, newSub);
        }
      } catch {
        // ignore
      }
    }
  };

  const selectedEpicMeta = epics.find((e) => e.id === currentEpicId);
  const epicItems: Record<string, React.ReactNode> = {
    none: t("noEpic"),
    ...Object.fromEntries(
      epics.map((ep) => [
        ep.id,
        <span key={ep.id} className="flex items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: ep.color }} />
          <span className="truncate">{ep.title}</span>
        </span>,
      ]),
    ),
  };

  return (
    <>
      <TaskShareModal
        boardId={boardId}
        taskId={currentTask.id}
        taskTitle={savedTitle}
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />

      <Dialog
        open={open}
        // Keep the ticket open when Placement (Select) or other portaled menus
        // fire outsidePress/focusOut against the dialog popup.
        disablePointerDismissal
        onOpenChange={(nextOpen, details) => {
          if (nextOpen) return;
          if (
            details.reason === "outside-press" ||
            details.reason === "focus-out"
          ) {
            return;
          }
          onClose();
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="grid-cols-[minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-[min(80rem,calc(100%-2rem))] xl:max-w-[min(88rem,calc(100%-2rem))] max-sm:pointer-coarse:top-0 max-sm:pointer-coarse:left-0 max-sm:pointer-coarse:h-dvh max-sm:pointer-coarse:w-screen max-sm:pointer-coarse:max-w-none max-sm:pointer-coarse:translate-x-0 max-sm:pointer-coarse:translate-y-0 max-sm:pointer-coarse:rounded-none max-sm:pointer-coarse:grid-rows-[auto_auto_minmax(0,1fr)] max-sm:pointer-coarse:pb-[env(safe-area-inset-bottom)]"
        >
          <DialogHeader className="flex flex-row items-center gap-2 px-4 py-3 border-b bg-muted/50">
            <DialogTitle className="text-sm font-medium text-muted-foreground flex-1 truncate flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 pointer-coarse:py-2.5 rounded-md bg-background hover:bg-muted border transition-all cursor-pointer select-none">
                  <span>{currentListTitle}</span>
                  <ChevronDown size={11} className="opacity-60" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {t("statusColumn")}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {lists.map((l) => (
                    <DropdownMenuItem
                      key={l.id}
                      onClick={() => handleMoveToList(l.id)}
                      className="flex items-center justify-between text-xs cursor-pointer py-1.5"
                    >
                      <span>{l.title}</span>
                      {l.id === currentListId && (
                        <Check size={13} className="text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {selectedEpicMeta && (
                <Badge
                  className="text-[10px] font-semibold text-white gap-1"
                  style={{ backgroundColor: selectedEpicMeta.color }}
                >
                  <Layers size={10} />
                  <span>{selectedEpicMeta.title}</span>
                </Badge>
              )}
            </DialogTitle>

            {/* Actions: Share + Task navigation */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Collapse or expand the comments panel (wide screens; on phones comments are a tab) */}
              <Tooltip>
                <TooltipTrigger
                  delay={200}
                  render={
                    <button
                      type="button"
                      onClick={toggleComments}
                      aria-expanded={commentsOpen}
                      aria-controls="ticket-comments-panel"
                      aria-label={`${commentsOpen ? t("commentsHide") : t("commentsShow")} (${commentCount})`}
                      className="relative hidden h-7 items-center gap-1 rounded-md border px-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground sm:inline-flex"
                    />
                  }
                >
                  <MessageSquare size={13} />
                  {commentCount > 0 && <span className="tabular-nums">{commentCount}</span>}
                  {hasNewComments && (
                    <span
                      role="img"
                      aria-label={t("commentsNew")}
                      className="absolute -right-1 -top-1 size-2.5 rounded-full bg-violet-500 ring-2 ring-background"
                    />
                  )}
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {commentsOpen ? t("commentsHide") : t("commentsShow")}
                  <kbd data-slot="kbd" className="rounded bg-background/20 px-1 font-mono text-[10px]">C</kbd>
                </TooltipContent>
              </Tooltip>

              {canEdit && <Button
                variant="outline"
                size="sm"
                onClick={() => setShareModalOpen(true)}
                className="h-7 pointer-coarse:h-10 pointer-coarse:px-3 text-xs gap-1 px-2 text-muted-foreground hover:text-foreground"
                title={t("shareTitle")}
              >
                <Share2 size={13} />
                <span className="hidden sm:inline">{t("share")}</span>
              </Button>}

              <div className="flex items-center gap-1 border-l pl-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 pointer-coarse:h-10 pointer-coarse:w-10"
                  disabled={!hasPrev}
                  onClick={() => goTo(currentIndex - 1)}
                  title={t("previous")}
                >
                  <ChevronLeft size={15} />
                </Button>
                <span className="text-xs text-muted-foreground tabular-nums min-w-12 text-center">
                  {currentIndex + 1} / {allTasks.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 pointer-coarse:h-10 pointer-coarse:w-10"
                  disabled={!hasNext}
                  onClick={() => goTo(currentIndex + 1)}
                  title={t("next")}
                >
                  <ChevronRight size={15} />
                </Button>
              </div>

              <DialogClose
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 pointer-coarse:h-10 pointer-coarse:w-10"
                    aria-label={tCommon("close")}
                    title={tCommon("close")}
                  />
                }
              >
                <X size={16} />
              </DialogClose>
            </div>
          </DialogHeader>

          {/* Mobile tab switcher */}
          <div className="flex sm:hidden border-b">
            <button
              className={`flex-1 py-2 pointer-coarse:py-3 text-sm font-medium transition-colors ${
                mobileTab === "details"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground"
              }`}
              onClick={() => setMobileTab("details")}
            >
              {t("details")}
            </button>
            <button
              className={`flex-1 py-2 pointer-coarse:py-3 text-sm font-medium transition-colors ${
                mobileTab === "comments"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground"
              }`}
              onClick={() => setMobileTab("comments")}
            >
              {t("comments")}
            </button>
          </div>

          <div
            key={currentTask.id}
            className="flex min-h-0 max-h-[78vh] overflow-hidden sm:h-[min(82vh,50rem)] max-sm:pointer-coarse:h-full max-sm:pointer-coarse:max-h-none"
          >
            {/* Left — task details */}
            <div
              className={`flex-1 overflow-y-auto px-4 pt-2 pb-6 flex flex-col gap-4 ${
                mobileTab !== "details" ? "hidden sm:flex" : ""
              }`}
            >
              <div className="flex items-start gap-2">
                <button
                  onClick={toggleCompleted}
                  disabled={!canEdit}
                  className="mt-4 shrink-0 text-muted-foreground hover:text-primary transition-colors disabled:hover:text-muted-foreground disabled:cursor-default"
                >
                  {completed ? (
                    <CheckCircle2 size={20} className="text-primary" />
                  ) : (
                    <Circle size={20} />
                  )}
                </button>

                {editingTitle ? (
                  <textarea
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => {
                      saveTitle();
                      setEditingTitle(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        saveTitle();
                        setEditingTitle(false);
                      }
                      if (e.key === "Escape") {
                        setTitle(savedTitle);
                        setEditingTitle(false);
                      }
                    }}
                    disabled={loading}
                    autoFocus
                    rows={1}
                    className="w-full text-2xl font-bold px-2 py-2 rounded-md border-0 outline-none focus:ring-1 focus:ring-ring resize-none bg-muted/50"
                  />
                ) : (
                  <h2
                    onClick={() => {
                      if (canEdit) setEditingTitle(true);
                    }}
                    className={`flex-1 text-2xl font-bold tracking-tight px-2 py-2 rounded-md transition-colors ${
                      canEdit ? "cursor-pointer hover:bg-muted/50" : ""
                    } ${
                      completed ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {savedTitle}
                  </h2>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 min-w-0">
                {canEdit && (
                  <TaskAiImprove
                    taskId={currentTask.id}
                    currentTitle={savedTitle}
                    currentDescription={savedDescription}
                    descriptionLanguage={descriptionLanguage}
                    onDescriptionLanguageChange={setDescriptionLanguage}
                    showLanguageSelect={false}
                    onApply={handleAiApply}
                  />
                )}
                <TaskDevelopment taskId={currentTask.id} />
              </div>

              {/* Metadata grouped by subject: Placement, Details, People */}
              <div className="flex flex-col gap-3 [&_button]:font-bold [&_button]:font-sans [&_button]:text-sm [&_input]:font-bold [&_input]:font-sans [&_input]:text-sm">
                <section
                  aria-labelledby="task-meta-placement"
                  className="flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-1.5">
                    <h3
                      id="task-meta-placement"
                      className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {t("fieldGroupPlacement")}
                    </h3>
                    <FieldGroupInfoHint text={t("fieldGroupPlacementHint")} />
                  </div>
                  <div className="flex gap-2 flex-wrap items-center">
                    {/* Selector de Estado / Lista */}
                    <Select
                      value={currentListId}
                      disabled={!canEdit}
                      onValueChange={(targetListId) => {
                        if (targetListId) handleMoveToList(targetListId);
                      }}
                    >
                      <SelectTrigger className="h-8 text-sm font-sans w-auto min-w-32 gap-1.5 font-bold bg-background border shadow-2xs">
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            getStatusTheme(currentListTitle || "").dot,
                          )}
                        />
                        <span className="truncate">{currentListTitle}</span>
                      </SelectTrigger>
                      <SelectContent>
                        {lists.map((l) => {
                          const theme = getStatusTheme(l.title);
                          return (
                            <SelectItem
                              key={l.id}
                              value={l.id}
                              className="text-xs cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn("w-2 h-2 rounded-full", theme.dot)}
                                />
                                <span>{l.title}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>

                    {/* Epic Selector */}
                    {epics.length > 0 && (
                      <Select
                        // sin `items`, base-ui muestra el id de la épica en el botón en lugar de su nombre
                        items={epicItems}
                        disabled={!canEdit}
                        value={currentEpicId || "none"}
                        onValueChange={(v) => saveEpic(v === "none" ? null : v)}
                      >
                        <SelectTrigger className="h-8 text-sm font-sans font-bold w-auto min-w-28 gap-1">
                          <Layers size={13} className="text-muted-foreground" />
                          <SelectValue placeholder={tBoard("epicFilter")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t("noEpic")}</SelectItem>
                          {epics.map((ep) => (
                            <SelectItem key={ep.id} value={ep.id}>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: ep.color }}
                                />
                                <span>{ep.title}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {canEdit ? (
                      <Select
                        value={currentQuarter || "none"}
                        onValueChange={(value) => void saveQuarter(value ?? "none")}
                      >
                        <SelectTrigger
                          className="h-8 text-sm font-sans font-bold w-auto min-w-36 gap-1"
                          aria-label={t("quarterLabel")}
                        >
                          <Calendar size={13} className="text-muted-foreground" />
                          <SelectValue placeholder={t("quarterLabel")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t("noQuarter")}</SelectItem>
                          {quarterSelectOptions.map((quarter) => (
                            <SelectItem key={quarter.key} value={quarter.key}>
                              {quarter.startDate
                                ? formatQuarterOptionLabel(quarter, locale)
                                : quarter.key}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : currentQuarter ? (
                      <Badge variant="secondary" className="h-8 gap-1 text-xs font-bold">
                        <Calendar size={13} />
                        {currentQuarter}
                      </Badge>
                    ) : null}
                    {!currentStartDate && !currentDueDate && (
                      <TaskDatePicker
                        taskId={currentTask.id}
                        listId={currentListId}
                        startDate={currentStartDate}
                        dueDate={currentDueDate}
                        beforeSave={(s, d) =>
                          assertQuarterDates(currentQuarter || null, {
                            startDate: s,
                            dueDate: d,
                          })
                        }
                        onSaved={(s, d) => {
                          setCurrentStartDate(s);
                          setCurrentDueDate(d);
                        }}
                      />
                    )}
                  </div>
                  {(currentStartDate || currentDueDate) && (
                    <TaskDatePicker
                      taskId={currentTask.id}
                      listId={currentListId}
                      startDate={currentStartDate}
                      dueDate={currentDueDate}
                      hideTrigger
                      beforeSave={(s, d) =>
                        assertQuarterDates(currentQuarter || null, {
                          startDate: s,
                          dueDate: d,
                        })
                      }
                      onSaved={(s, d) => {
                        setCurrentStartDate(s);
                        setCurrentDueDate(d);
                      }}
                    />
                  )}
                </section>

                <section
                  aria-labelledby="task-meta-details"
                  className="flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-1.5">
                    <h3
                      id="task-meta-details"
                      className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {t("fieldGroupDetails")}
                    </h3>
                    <FieldGroupInfoHint text={t("fieldGroupDetailsHint")} />
                  </div>
                  <div className="flex gap-2 flex-wrap items-center">
                    <TaskLabels
                      taskId={currentTask.id}
                      boardId={boardId}
                      activeLabels={activeLabels}
                      onLabelsChange={(labels) => {
                        setActiveLabels(labels);
                        updateTask(currentListId, currentTask.id, { labels });
                      }}
                    />
                    <TaskPriority
                      taskId={currentTask.id}
                      priority={priority}
                      onSaved={(p) => {
                        setPriority(p);
                        updateTask(currentListId, currentTask.id, { priority: p });
                      }}
                    />
                    {canEdit && (
                      <span className="relative inline-flex h-8 shrink-0 items-center rounded-md border bg-background pl-2.5 pr-2 shadow-2xs">
                        <Globe size={13} className="shrink-0 text-muted-foreground" aria-hidden />
                        <select
                          aria-label={t("descriptionLanguage")}
                          title={t("descriptionLanguage")}
                          value={descriptionLanguage}
                          onChange={(event) => {
                            const language = event.target.value;
                            if (
                              language === "en" ||
                              language === "es" ||
                              language === "tl"
                            ) {
                              setDescriptionLanguage(language);
                            }
                          }}
                          className="h-8 cursor-pointer appearance-none border-0 bg-transparent py-0 pl-1.5 pr-5 text-sm font-sans leading-8 font-bold text-foreground focus-visible:outline-none"
                        >
                          <option value="en">English</option>
                          <option value="es">Español</option>
                          <option value="tl">Tagalog</option>
                        </select>
                        <ChevronDown
                          size={14}
                          className="pointer-events-none absolute right-2 text-muted-foreground"
                          aria-hidden
                        />
                      </span>
                    )}
                    {canEdit && (
                      <Button
                        variant="outline"
                        onClick={() => attachmentsRef.current?.openFilePicker()}
                      >
                        <Paperclip size={15} />
                        <span>{t("attach")}</span>
                      </Button>
                    )}
                  </div>
                  {activeLabels.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {activeLabels.map(({ label }) => (
                        <Badge
                          key={label.id}
                          className="text-white font-medium"
                          style={{ backgroundColor: label.color }}
                        >
                          {label.title}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <TaskAttachments ref={attachmentsRef} taskId={currentTask.id} />
                </section>

                {(canManage ||
                  memberCanAssign ||
                  Boolean(assignee) ||
                  Boolean(qa) ||
                  Boolean(reporter) ||
                  collaborators.length > 0) && (
                  <section
                    aria-labelledby="task-meta-people"
                    className="flex flex-col gap-1.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <h3
                        id="task-meta-people"
                        className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {t("fieldGroupPeople")}
                      </h3>
                      <FieldGroupInfoHint text={t("fieldGroupPeopleHint")} />
                    </div>
                    <div className="flex gap-2 flex-wrap items-center">
                      <TaskReporter
                        taskId={currentTask.id}
                        boardUsers={boardUsers}
                        reporter={reporter}
                        canManage={canManage}
                        memberCanAssign={memberCanAssign}
                        onReporterChange={(nextReporter) => {
                          setReporter(nextReporter);
                          updateTask(currentListId, currentTask.id, {
                            reporter: nextReporter,
                            reporterId: nextReporter ? nextReporter.id : null,
                          });
                        }}
                      />
                      <TaskAssignee
                        taskId={currentTask.id}
                        boardUsers={boardUsers}
                        assignee={assignee}
                        canManage={canManage}
                        memberCanAssign={memberCanAssign}
                        onAssigneeChange={(nextAssignee) => {
                          setAssignee(nextAssignee);
                          updateTask(currentListId, currentTask.id, {
                            assignee: nextAssignee,
                            assigneeId: nextAssignee ? nextAssignee.id : null,
                          });
                        }}
                      />
                      <TaskCollaborators
                        taskId={currentTask.id}
                        boardUsers={boardUsers}
                        collaborators={collaborators}
                        canManage={canManage}
                        memberCanAssign={memberCanAssign}
                        onCollaboratorsChange={(nextCollabs) => {
                          setCollaborators(nextCollabs);
                          updateTask(currentListId, currentTask.id, {
                            collaborators: nextCollabs,
                          });
                        }}
                      />
                      <TaskQa
                        taskId={currentTask.id}
                        boardUsers={boardUsers}
                        qa={qa}
                        canManage={canManage}
                        memberCanAssign={memberCanAssign}
                        onQaChange={(nextQa) => {
                          setQa(nextQa);
                          updateTask(currentListId, currentTask.id, {
                            qa: nextQa,
                            qaId: nextQa ? nextQa.id : null,
                          });
                        }}
                      />
                    </div>
                  </section>
                )}
              </div>

              <TaskHierarchy
                focusId={currentTask.id}
                nodes={hierarchyNodes}
                onNavigate={(id) => {
                  const index = allTasks.findIndex((entry) => entry.task.id === id);
                  if (index >= 0) goTo(index);
                }}
              />

              {/* Custom Values / Custom Fields */}
              <TaskCustomFields
                taskId={currentTask.id}
                boardId={boardId}
                // Los campos padre/hijo se guardan por API: se refresca el tablero para que el recorrido y las tarjetas se actualicen ya.
                onTicketLinkChange={() => router.refresh()}
              />

              <div className="flex flex-col gap-3 rounded-xl border bg-background p-3.5">
                <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <AlignLeft size={15} className="text-muted-foreground" />
                  <span>{t("description")}</span>
                </div>

                {editingDescription ? (
                  <TaskDescriptionEditor
                    content={formatTicketDescriptionHtml(savedDescription)}
                    loading={loading}
                    onSave={(html) => saveDescription(html)}
                    onCancel={() => setEditingDescription(false)}
                  />
                ) : (
                  <div
                    onClick={() => {
                      if (canEdit) setEditingDescription(true);
                    }}
                    className={`min-h-16 w-full rounded-md px-3 py-2 text-sm transition-colors ${
                      canEdit ? "cursor-pointer hover:bg-muted" : ""
                    }`}
                  >
                    {savedDescription ? (
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none prose-headings:mt-3 prose-headings:mb-1.5 prose-headings:font-semibold prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-blockquote:border-l-primary/40 prose-pre:rounded-lg prose-pre:bg-muted prose-pre:text-foreground prose-code:before:content-none prose-code:after:content-none"
                        dangerouslySetInnerHTML={{
                          __html: formatTicketDescriptionHtml(savedDescription),
                        }}
                      />
                    ) : (
                      <span className="text-muted-foreground">
                        {t("descriptionPlaceholder")}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <TaskSubtasks taskId={currentTask.id} listId={currentListId} />
            </div>

            {/* Right — comments */}
            <div
              id="ticket-comments-panel"
              className={`sm:w-96 lg:w-[28rem] sm:shrink-0 sm:border-l bg-muted/30 flex-col min-h-0 ${
                mobileTab === "comments" ? "flex flex-1" : "hidden"
              } ${commentsOpen ? "sm:flex" : "sm:hidden"}`}
            >
              <TaskComments
                taskId={currentTask.id}
                members={boardUsers}
                onCountChange={handleCountChange}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

