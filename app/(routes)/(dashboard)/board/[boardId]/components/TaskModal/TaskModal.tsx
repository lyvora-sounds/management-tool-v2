"use client";

import { useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import {
  Dialog,
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
import { TaskSubtasks } from "../TaskSubtasks/TaskSubtasks";
import { TaskPriority } from "../TaskPriority/TaskPriority";
import { TaskAiImprove } from "../TaskAiImprove/TaskAiImprove";
import { TaskShareModal } from "../TaskShareModal/TaskShareModal";
import type { Priority } from "../TaskPriority/TaskPriority.constants";
import type { LabelModel } from "@/lib/generated/prisma/models/Label";
import type { BoardUser, TaskCollaborator } from "../TaskCard/TaskCard.types";
import { TaskModalProps } from "./TaskModal.types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getStatusTheme } from "@/lib/statusTheme";

export function TaskModal({
  task,
  listId,
  listTitle,
  boardId,
  open,
  onClose,
  isOwner,
  boardUsers,
  memberCanAssign,
}: TaskModalProps) {
  const lists = useBoardStore((s) => s.lists);
  const updateTask = useBoardStore((s) => s.updateTask);
  const addSubtask = useBoardStore((s) => s.addSubtask);
  const moveTask = useBoardStore((s) => s.moveTask);
  const attachmentsRef = useRef<TaskAttachmentsHandle>(null);

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
  const [collaborators, setCollaborators] = useState<TaskCollaborator[]>(
    currentTask.collaborators ?? [],
  );
  const [priority, setPriority] = useState<Priority | null>(
    (currentTask.priority as Priority) ?? null,
  );
  const [currentEpicId, setCurrentEpicId] = useState<string | null>(
    (currentTask as any).epicId ?? null,
  );
  const [currentQuarter, setCurrentQuarter] = useState<string>(
    (currentTask as any).quarter ?? "",
  );
  const [epics, setEpics] = useState<{ id: string; title: string; color: string }[]>([]);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<"details" | "comments">("details");

  // Load board Epics
  useEffect(() => {
    if (open) {
      fetch(`/api/boards/${boardId}/epics`)
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
      setCollaborators(currentTask.collaborators ?? []);
      setPriority((currentTask.priority as Priority) ?? null);
      setCurrentEpicId((currentTask as any).epicId ?? null);
      setCurrentQuarter((currentTask as any).quarter ?? "");
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
  ]);

  const handleMoveToList = async (targetListId: string) => {
    if (targetListId === currentListId) return;
    const targetList = lists.find((l) => l.id === targetListId);
    if (!targetList) return;

    const isDone = /hecho|done|completad|finaliz/i.test(targetList.title);
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
      const res = await fetch(`/api/tasks/updateTask/${currentTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId: targetListId }),
      });
      if (res.ok) {
        toast.success(`Movido a "${targetList.title}"`);
      } else {
        toast.error("Error al mover la tarea");
      }
    } catch {
      toast.error("Error al mover la tarea");
    }
  };

  const toggleCompleted = async () => {
    const next = !completed;
    const doneList = lists.find((l) =>
      /hecho|done|completad|finaliz/i.test(l.title),
    );
    const todoList =
      lists.find((l) => /hacer|todo|to do|pendient|backlog/i.test(l.title)) ||
      lists[0];

    const targetList = next ? doneList : todoList;

    if (targetList && targetList.id !== currentListId) {
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

      const res = await fetch(`/api/tasks/updateTask/${currentTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId: targetList.id, completed: next }),
      });
      if (res.ok) {
        toast.success(
          next
            ? `Completada y movida a "${targetList.title}"`
            : `Reactivada y movida a "${targetList.title}"`,
        );
      }
    } else {
      setCompleted(next);
      updateTask(currentListId, currentTask.id, { completed: next });
      const res = await fetch(`/api/tasks/updateTask/${currentTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: next }),
      });
      if (res.ok) {
        toast.success(next ? "Tarea completada" : "Tarea reactivada");
      }
    }
  };

  const saveTitle = async () => {
    const trimmed = title.trim();
    if (!trimmed || trimmed === savedTitle) {
      setTitle(savedTitle);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/tasks/updateTask/${currentTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed }),
    });
    if (res.ok) {
      updateTask(currentListId, currentTask.id, { title: trimmed });
      setSavedTitle(trimmed);
      toast.success("Título actualizado");
    } else {
      setTitle(savedTitle);
      toast.error("Error al actualizar el título");
    }
    setLoading(false);
  };

  const saveDescription = async (html: string) => {
    if (html === savedDescription) {
      setEditingDescription(false);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/tasks/updateTask/${currentTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: html }),
    });
    if (res.ok) {
      updateTask(currentListId, currentTask.id, { description: html || null });
      setSavedDescription(html);
      toast.success("Descripción guardada");
    } else {
      toast.error("Error al guardar la descripción");
    }
    setEditingDescription(false);
    setLoading(false);
  };

  const saveEpic = async (epicId: string | null) => {
    setCurrentEpicId(epicId);
    await fetch(`/api/tasks/updateTask/${currentTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ epicId }),
    });
    updateTask(currentListId, currentTask.id, { epicId } as any);
  };

  const saveQuarter = async (quarterVal: string) => {
    setCurrentQuarter(quarterVal);
    await fetch(`/api/tasks/updateTask/${currentTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quarter: quarterVal.trim() || null }),
    });
    updateTask(currentListId, currentTask.id, { quarter: quarterVal.trim() || null } as any);
  };

  const handleAiApply = async (
    newTitle: string,
    newDescription: string,
    acceptedSubtasks: string[],
  ) => {
    // 1. Update title & description
    if (newTitle && newTitle !== savedTitle) {
      setTitle(newTitle);
      setSavedTitle(newTitle);
    }
    if (newDescription && newDescription !== savedDescription) {
      setSavedDescription(newDescription);
    }

    await fetch(`/api/tasks/updateTask/${currentTask.id}`, {
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
        const res = await fetch(`/api/tasks/${currentTask.id}/subtasks`, {
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

  return (
    <>
      <TaskShareModal
        taskId={currentTask.id}
        taskTitle={savedTitle}
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />

      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="flex flex-row items-center gap-2 px-4 py-3 border-b bg-muted/50">
            <DialogTitle className="text-sm font-medium text-muted-foreground flex-1 truncate flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-background hover:bg-muted border transition-all cursor-pointer select-none">
                  <span>{currentListTitle}</span>
                  <ChevronDown size={11} className="opacity-60" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Estado / Columna
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
            <div className="flex items-center gap-2 shrink-0 mr-10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShareModalOpen(true)}
                className="h-7 text-xs gap-1 px-2 text-muted-foreground hover:text-foreground"
                title="Compartir enlace público de solo lectura"
              >
                <Share2 size={13} />
                <span className="hidden sm:inline">Compartir</span>
              </Button>

              <div className="flex items-center gap-1 border-l pl-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={!hasPrev}
                  onClick={() => goTo(currentIndex - 1)}
                  title="Tarea anterior (←)"
                >
                  <ChevronLeft size={15} />
                </Button>
                <span className="text-xs text-muted-foreground tabular-nums min-w-12 text-center">
                  {currentIndex + 1} / {allTasks.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={!hasNext}
                  onClick={() => goTo(currentIndex + 1)}
                  title="Tarea siguiente (→)"
                >
                  <ChevronRight size={15} />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Mobile tab switcher */}
          <div className="flex sm:hidden border-b">
            <button
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mobileTab === "details"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground"
              }`}
              onClick={() => setMobileTab("details")}
            >
              Detalles
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mobileTab === "comments"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground"
              }`}
              onClick={() => setMobileTab("comments")}
            >
              Comentarios
            </button>
          </div>

          <div
            key={currentTask.id}
            className="flex sm:divide-x overflow-hidden"
            style={{ maxHeight: "70vh" }}
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
                  className="mt-4 shrink-0 text-muted-foreground hover:text-primary transition-colors"
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
                    onClick={() => setEditingTitle(true)}
                    className={`flex-1 text-2xl font-bold px-2 py-2 cursor-pointer hover:bg-muted/50 rounded-md transition-colors ${
                      completed ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {savedTitle}
                  </h2>
                )}
              </div>

              {/* AI Improve Suggestion Trigger Panel */}
              <TaskAiImprove
                taskId={currentTask.id}
                currentTitle={savedTitle}
                currentDescription={savedDescription}
                onApply={handleAiApply}
              />

              {/* Labels + Dates + Priority + Epic + Quarter + Attachments row */}
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 flex-wrap items-center">
                  {/* Selector de Estado / Lista */}
                  <Select
                    value={currentListId}
                    onValueChange={(targetListId) => {
                      if (targetListId) handleMoveToList(targetListId);
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs w-auto min-w-32 gap-1.5 font-medium bg-background border shadow-2xs">
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

                  <TaskLabels
                    taskId={currentTask.id}
                    boardId={boardId}
                    activeLabels={activeLabels}
                    onLabelsChange={(labels) => {
                      setActiveLabels(labels);
                      updateTask(currentListId, currentTask.id, { labels });
                    }}
                  />
                  {!currentStartDate && !currentDueDate && (
                    <TaskDatePicker
                      taskId={currentTask.id}
                      listId={currentListId}
                      startDate={currentStartDate}
                      dueDate={currentDueDate}
                      onSaved={(s, d) => {
                        setCurrentStartDate(s);
                        setCurrentDueDate(d);
                      }}
                    />
                  )}
                  <TaskPriority
                    taskId={currentTask.id}
                    priority={priority}
                    onSaved={(p) => {
                      setPriority(p);
                      updateTask(currentListId, currentTask.id, { priority: p });
                    }}
                  />

                  {/* Epic Selector */}
                  {epics.length > 0 && (
                    <Select
                      value={currentEpicId || "none"}
                      onValueChange={(v) => saveEpic(v === "none" ? null : v)}
                    >
                      <SelectTrigger className="h-8 text-xs w-auto min-w-28 gap-1">
                        <Layers size={13} className="text-muted-foreground" />
                        <SelectValue placeholder="Epic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin Epic</SelectItem>
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

                  {/* Quarter Input */}
                  <div className="flex items-center gap-1 border rounded-md px-2 py-1 h-8 bg-background">
                    <Calendar size={13} className="text-muted-foreground" />
                    <input
                      placeholder="Q (ej. 2026-Q1)"
                      value={currentQuarter}
                      onChange={(e) => setCurrentQuarter(e.target.value)}
                      onBlur={() => saveQuarter(currentQuarter)}
                      className="text-xs bg-transparent border-0 outline-none w-20"
                    />
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => attachmentsRef.current?.openFilePicker()}
                  >
                    <Paperclip size={15} />
                    <span>Adjuntar</span>
                  </Button>
                  <TaskAssignee
                    taskId={currentTask.id}
                    boardUsers={boardUsers}
                    assignee={assignee}
                    isOwner={isOwner}
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
                    isOwner={isOwner}
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
                    isOwner={isOwner}
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

                {(currentStartDate || currentDueDate) && (
                  <TaskDatePicker
                    taskId={currentTask.id}
                    listId={currentListId}
                    startDate={currentStartDate}
                    dueDate={currentDueDate}
                    hideTrigger
                    onSaved={(s, d) => {
                      setCurrentStartDate(s);
                      setCurrentDueDate(d);
                    }}
                  />
                )}

                <TaskAttachments ref={attachmentsRef} taskId={currentTask.id} />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlignLeft size={15} />
                  <span>Descripción</span>
                </div>

                {editingDescription ? (
                  <TaskDescriptionEditor
                    content={savedDescription}
                    loading={loading}
                    onSave={(html) => saveDescription(html)}
                    onCancel={() => setEditingDescription(false)}
                  />
                ) : (
                  <div
                    onClick={() => setEditingDescription(true)}
                    className="min-h-16 w-full rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-muted transition-colors"
                  >
                    {savedDescription ? (
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: savedDescription }}
                      />
                    ) : (
                      <span className="text-muted-foreground">
                        Añade una descripción...
                      </span>
                    )}
                  </div>
                )}
              </div>

              <TaskSubtasks taskId={currentTask.id} listId={currentListId} />
            </div>

            {/* Right — comments */}
            <div
              className={`sm:w-72 sm:shrink-0 flex flex-col px-4 pt-2 pb-4 min-h-0 ${
                mobileTab !== "comments" ? "hidden sm:flex" : "flex-1"
              }`}
            >
              <TaskComments taskId={currentTask.id} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

