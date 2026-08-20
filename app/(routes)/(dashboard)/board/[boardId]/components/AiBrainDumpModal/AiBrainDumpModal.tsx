"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  Loader2,
  Trash2,
  Check,
  Calendar,
  Layers,
  ArrowRight,
  ListPlus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { VoiceInput } from "@/components/Shared/VoiceInput/VoiceInput";
import { useBoardStore } from "../../store/useBoardStore";
import { ParsedTask } from "@/lib/ai/types";
import { PRIORITIES, Priority } from "../TaskPriority/TaskPriority.constants";
import Link from "next/link";

interface AiBrainDumpModalProps {
  boardId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AiBrainDumpModal({
  boardId,
  open,
  onClose,
  onSuccess,
}: AiBrainDumpModalProps) {
  const lists = useBoardStore((s) => s.lists);
  const [inputText, setInputText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [inserting, setInserting] = useState(false);
  const [parsedTasks, setParsedTasks] = useState<
    (ParsedTask & { targetListId: string; targetEpicId?: string | null })[]
  >([]);
  const [epics, setEpics] = useState<{ id: string; title: string; color: string }[]>([]);
  const [noApiKey, setNoApiKey] = useState(false);

  useEffect(() => {
    if (open) {
      loadEpics();
    }
  }, [open, boardId]);

  const loadEpics = async () => {
    try {
      const res = await fetch(`/api/boards/${boardId}/epics`);
      if (res.ok) {
        const data = await res.json();
        setEpics(data.epics || []);
      }
    } catch {
      // ignore
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setInputText((prev) => (prev ? `${prev}\n${text}` : text));
  };

  const handleParse = async () => {
    if (!inputText.trim()) {
      toast.info("Introduce o dicta algún texto para procesar");
      return;
    }

    setParsing(true);
    setNoApiKey(false);
    try {
      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      const data = await res.json();
      if (res.ok && Array.isArray(data.tasks)) {
        const defaultListId = lists[0]?.id || "";
        const prepared = data.tasks.map((t: ParsedTask) => {
          // match suggested list name if possible
          const matchedList = lists.find(
            (l) =>
              t.suggestedList &&
              l.title.toLowerCase().includes(t.suggestedList.toLowerCase()),
          );
          return {
            ...t,
            targetListId: matchedList?.id || defaultListId,
            targetEpicId: null,
          };
        });

        setParsedTasks(prepared);
        toast.success(`Se han extraído ${prepared.length} tareas`);
      } else {
        if (data.error && data.error.includes("Ajustes")) {
          setNoApiKey(true);
        } else {
          toast.error(data.error || "Error al procesar con IA");
        }
      }
    } catch {
      toast.error("Error de conexión al llamar a la IA");
    } finally {
      setParsing(false);
    }
  };

  const handleRemoveTask = (index: number) => {
    setParsedTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateTaskField = (index: number, field: string, value: any) => {
    setParsedTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)),
    );
  };

  const handleInsertAll = async () => {
    if (parsedTasks.length === 0) return;

    setInserting(true);
    try {
      const payload = parsedTasks.map((t) => ({
        title: t.title,
        description: t.description,
        priority: t.priority,
        dueDate: t.dueDate,
        startDate: t.startDate,
        quarter: t.quarter,
        listId: t.targetListId,
        epicId: t.targetEpicId,
        subtasks: t.subtasks,
      }));

      const res = await fetch(`/api/boards/${boardId}/batchTasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: payload }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`${data.count} tareas añadidas al board`);
        setInputText("");
        setParsedTasks([]);
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || "Error al guardar tareas");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setInserting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-muted/40 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Sparkles size={18} />
            </div>
            <DialogTitle className="text-base font-semibold">
              Brain Dump con Inteligencia Artificial
            </DialogTitle>
          </div>
          <VoiceInput onTranscript={handleVoiceTranscript} className="mr-6" />
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Input text section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground">
                Pega tus notas, actas de reunión o escribe tus ideas libres:
              </label>
              <span className="text-[11px] text-muted-foreground">
                Soporta Español y English
              </span>
            </div>
            <Textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ejemplo: Necesitamos implementar el rediseño del navbar para el Q3 con fecha límite 20 de septiembre. Además hay que arreglar el bug de inicio de sesión urgente con dos subtareas: revisar tokens y actualizar cookies..."
              className="text-sm bg-background resize-y"
            />
            <div className="flex justify-end pt-1">
              <Button
                size="sm"
                onClick={handleParse}
                disabled={parsing || !inputText.trim()}
                className="gap-1.5 h-8 text-xs font-semibold"
              >
                {parsing ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Sparkles size={13} />
                )}
                <span>Extraer y estructurar tareas con IA</span>
              </Button>
            </div>
          </div>

          {/* Missing API Key Alert */}
          {noApiKey && (
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
              <p className="font-semibold text-amber-700 dark:text-amber-400">
                Clave API de IA requerida
              </p>
              <p className="text-muted-foreground">
                Para usar Brain Dump, por favor agrega tu API key personal (OpenAI, Claude, Gemini, DeepSeek, Grok o Kimi) en Ajustes.
              </p>
              <Button asChild size="sm" className="gap-1.5 mt-2 h-7 text-xs">
                <Link href="/dashboard/settings">
                  <span>Ir a Ajustes</span>
                  <ArrowRight size={13} />
                </Link>
              </Button>
            </div>
          )}

          {/* Parsed Tasks Preview */}
          {parsedTasks.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <ListPlus size={16} className="text-primary" />
                  <span>Tareas detectadas ({parsedTasks.length})</span>
                </h4>
                <span className="text-xs text-muted-foreground">
                  Revisa y ajusta antes de insertar en el board
                </span>
              </div>

              <div className="space-y-3">
                {parsedTasks.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border bg-card hover:border-primary/40 transition-colors space-y-3"
                  >
                    {/* Top Row: Title + Remove */}
                    <div className="flex items-start justify-between gap-3">
                      <Input
                        value={t.title}
                        onChange={(e) =>
                          handleUpdateTaskField(idx, "title", e.target.value)
                        }
                        className="font-semibold text-sm h-8"
                        placeholder="Título de la tarea"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveTask(idx)}
                        className="h-8 w-8 text-muted-foreground hover:text-rose-500 shrink-0"
                        title="Descartar tarea"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>

                    {/* Metadata controls: List, Epic, Priority, Quarter */}
                    <div className="grid gap-2 sm:grid-cols-4">
                      {/* Destination List */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-muted-foreground">
                          Lista de destino
                        </label>
                        <Select
                          value={t.targetListId}
                          onValueChange={(v) =>
                            handleUpdateTaskField(idx, "targetListId", v)
                          }
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {lists.map((l) => (
                              <SelectItem key={l.id} value={l.id}>
                                {l.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Destination Epic */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-muted-foreground">
                          Epic
                        </label>
                        <Select
                          value={t.targetEpicId || "none"}
                          onValueChange={(v) =>
                            handleUpdateTaskField(
                              idx,
                              "targetEpicId",
                              v === "none" ? null : v,
                            )
                          }
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Sin Epic" />
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
                      </div>

                      {/* Priority */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-muted-foreground">
                          Prioridad
                        </label>
                        <Select
                          value={t.priority}
                          onValueChange={(v) =>
                            handleUpdateTaskField(idx, "priority", v as Priority)
                          }
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRIORITIES.map((p) => (
                              <SelectItem key={p.value} value={p.value}>
                                {p.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Quarter */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-muted-foreground">
                          Quarter
                        </label>
                        <Input
                          value={t.quarter || ""}
                          onChange={(e) =>
                            handleUpdateTaskField(idx, "quarter", e.target.value)
                          }
                          placeholder="2026-Q1"
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>

                    {/* Subtasks Checklist */}
                    {t.subtasks && t.subtasks.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          Subtareas ({t.subtasks.length}):
                        </span>
                        <ul className="space-y-1 pl-2">
                          {t.subtasks.map((sub, sIdx) => (
                            <li
                              key={sIdx}
                              className="text-xs text-muted-foreground flex items-center gap-1.5"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                              <span>{sub.title}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Insert action bar */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleInsertAll}
                  disabled={inserting || parsedTasks.length === 0}
                  className="gap-1.5"
                >
                  {inserting ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Check size={13} />
                  )}
                  <span>Insertar {parsedTasks.length} tareas en el Board</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
