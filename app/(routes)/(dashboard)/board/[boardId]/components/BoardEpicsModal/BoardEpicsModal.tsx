"use client";

import { useEffect, useState } from "react";
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  Calendar,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface EpicItem {
  id: string;
  title: string;
  description: string | null;
  color: string;
  quarter: string | null;
  status: string;
  totalTasks: number;
  completedTasks: number;
  progress: number;
}

interface BoardEpicsModalProps {
  boardId: string;
  open: boolean;
  onClose: () => void;
  onEpicsChange?: () => void;
}

const PRESET_COLORS = [
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#f97316", // Orange
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#eab308", // Yellow
  "#64748b", // Slate
];

export function BoardEpicsModal({
  boardId,
  open,
  onClose,
  onEpicsChange,
}: BoardEpicsModalProps) {
  const [epics, setEpics] = useState<EpicItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [quarter, setQuarter] = useState("2026-Q1");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editQuarter, setEditQuarter] = useState("");
  const [editColor, setEditColor] = useState("");

  useEffect(() => {
    if (open) {
      loadEpics();
    }
  }, [open, boardId]);

  const loadEpics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/epics`);
      if (res.ok) {
        const data = await res.json();
        setEpics(data.epics || []);
      }
    } catch {
      toast.error("Error al cargar Epics");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/epics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          color,
          quarter,
        }),
      });

      if (res.ok) {
        toast.success("Epic creado exitosamente");
        setTitle("");
        setDescription("");
        setCreating(false);
        await loadEpics();
        onEpicsChange?.();
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al crear Epic");
      }
    } catch {
      toast.error("Error de red");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editTitle.trim()) return;
    try {
      const res = await fetch(`/api/boards/${boardId}/epics`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          title: editTitle,
          quarter: editQuarter,
          color: editColor,
        }),
      });

      if (res.ok) {
        toast.success("Epic actualizado");
        setEditingId(null);
        await loadEpics();
        onEpicsChange?.();
      }
    } catch {
      toast.error("Error al actualizar Epic");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar el Epic "${name}"? Las tareas asociadas no se borrarán.`)) return;

    try {
      const res = await fetch(`/api/boards/${boardId}/epics?epicId=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Epic eliminado");
        await loadEpics();
        onEpicsChange?.();
      }
    } catch {
      toast.error("Error al eliminar Epic");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-muted/40 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Layers size={18} />
            </div>
            <DialogTitle className="text-base font-semibold">
              Gestión de Epics & Trimestres
            </DialogTitle>
          </div>
          {!creating && (
            <Button
              size="sm"
              onClick={() => setCreating(true)}
              className="gap-1.5 h-8 text-xs mr-6"
            >
              <Plus size={13} />
              <span>Nuevo Epic</span>
            </Button>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Create Form */}
          {creating && (
            <form
              onSubmit={handleCreate}
              className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Crear nuevo Epic</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCreating(false)}
                  className="h-7 w-7 p-0"
                >
                  <X size={14} />
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Título del Epic
                  </label>
                  <Input
                    required
                    placeholder="Ej. Rediseño de Checkout, Migración v2..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Calendar size={12} />
                    <span>Trimestre / Quarter</span>
                  </label>
                  <Input
                    placeholder="Ej. 2026-Q1, 2026-Q2..."
                    value={quarter}
                    onChange={(e) => setQuarter(e.target.value)}
                    className="bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Color identificativo
                  </label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          color === c ? "scale-125 ring-2 ring-offset-1 ring-ring" : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Descripción (opcional)
                  </label>
                  <Input
                    placeholder="Objetivo principal del epic..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCreating(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={loading}>
                  {loading && <Loader2 size={13} className="animate-spin mr-1" />}
                  <span>Guardar Epic</span>
                </Button>
              </div>
            </form>
          )}

          {/* Epics List */}
          {loading && !epics.length ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-muted-foreground" size={24} />
            </div>
          ) : epics.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="p-3 rounded-full bg-muted w-fit mx-auto">
                <Layers size={24} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No hay Epics creados en este board</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Los Epics te permiten agrupar tareas por iniciativas estratégicas o trimestres (Q1, Q2, etc.) y seguir su progreso global.
              </p>
              <Button size="sm" onClick={() => setCreating(true)} className="gap-1 mt-2">
                <Plus size={13} />
                <span>Crear primer Epic</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {epics.map((epic) => {
                const isEditing = editingId === epic.id;
                return (
                  <div
                    key={epic.id}
                    className="p-4 rounded-xl border bg-card hover:bg-muted/20 transition-colors space-y-3"
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Título del Epic"
                            className="text-sm font-semibold"
                          />
                          <Input
                            value={editQuarter}
                            onChange={(e) => setEditQuarter(e.target.value)}
                            placeholder="Quarter (Ej. 2026-Q1)"
                            className="w-32 text-xs"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleUpdate(epic.id)}
                            className="h-8 w-8 text-emerald-600"
                          >
                            <Check size={16} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                            className="h-8 w-8 text-muted-foreground"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setEditColor(c)}
                              className={`w-5 h-5 rounded-full ${
                                editColor === c ? "ring-2 ring-offset-1 ring-ring scale-110" : ""
                              }`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: epic.color }}
                            />
                            <h4 className="text-sm font-bold text-foreground">
                              {epic.title}
                            </h4>
                            {epic.quarter && (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-semibold text-muted-foreground"
                              >
                                {epic.quarter}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingId(epic.id);
                                setEditTitle(epic.title);
                                setEditQuarter(epic.quarter || "");
                                setEditColor(epic.color);
                              }}
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            >
                              <Edit2 size={13} />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(epic.id, epic.title)}
                              className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </div>

                        {epic.description && (
                          <p className="text-xs text-muted-foreground">
                            {epic.description}
                          </p>
                        )}

                        {/* Progress */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {epic.completedTasks} de {epic.totalTasks} tareas completadas
                            </span>
                            <span className="font-semibold tabular-nums">
                              {epic.progress}%
                            </span>
                          </div>
                          <Progress value={epic.progress} className="h-1.5" />
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
