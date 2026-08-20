"use client";

import { useEffect, useState } from "react";
import {
  Archive,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
  Loader2,
  Filter,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useBoardStore } from "../../store/useBoardStore";

interface ArchiveTasksModalProps {
  boardId: string;
  open: boolean;
  onClose: () => void;
  onRefreshBoard: () => void;
}

export function ArchiveTasksModal({
  boardId,
  open,
  onClose,
  onRefreshBoard,
}: ArchiveTasksModalProps) {
  const lists = useBoardStore((s) => s.lists);
  const [activeTab, setActiveTab] = useState<"bulk_archive" | "view_archived">("bulk_archive");
  const [archivedTasks, setArchivedTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Bulk archive filters & selection
  const [quarterFilter, setQuarterFilter] = useState<string>("all");
  const [onlyCompleted, setOnlyCompleted] = useState<boolean>(true);
  const [selectedToArchive, setSelectedToArchive] = useState<string[]>([]);
  const [selectedToRestore, setSelectedToRestore] = useState<string[]>([]);

  // Collect all active tasks in current board
  const allActiveTasks = lists.flatMap((l) =>
    l.tasks.map((t) => ({ ...t, listTitle: l.title })),
  );

  // Available quarters from tasks
  const availableQuarters = Array.from(
    new Set(allActiveTasks.map((t) => t.quarter).filter(Boolean) as string[]),
  );

  // Filter tasks eligible for archiving
  const eligibleTasks = allActiveTasks.filter((t) => {
    if (onlyCompleted && !t.completed) return false;
    if (quarterFilter !== "all" && t.quarter !== quarterFilter) return false;
    return true;
  });

  useEffect(() => {
    if (open && activeTab === "view_archived") {
      loadArchivedTasks();
    }
  }, [open, activeTab, boardId]);

  const loadArchivedTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/archive`);
      if (res.ok) {
        const data = await res.json();
        setArchivedTasks(data.tasks || []);
      }
    } catch {
      toast.error("Error al cargar tareas archivadas");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectToArchive = (id: string) => {
    setSelectedToArchive((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const selectAllEligible = () => {
    if (selectedToArchive.length === eligibleTasks.length) {
      setSelectedToArchive([]);
    } else {
      setSelectedToArchive(eligibleTasks.map((t) => t.id));
    }
  };

  const handleBulkArchive = async () => {
    const idsToArchive = selectedToArchive.length > 0 ? selectedToArchive : eligibleTasks.map((t) => t.id);
    if (idsToArchive.length === 0) {
      toast.info("No hay tareas seleccionadas para archivar");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds: idsToArchive }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`${data.archivedCount} tareas archivadas`);
        setSelectedToArchive([]);
        onRefreshBoard();
        onClose();
      } else {
        toast.error(data.error || "Error al archivar");
      }
    } catch {
      toast.error("Error de red");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (ids: string[]) => {
    if (ids.length === 0) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds: ids }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`${data.unarchivedCount} tareas restauradas al board`);
        setSelectedToRestore([]);
        await loadArchivedTasks();
        onRefreshBoard();
      } else {
        toast.error(data.error || "Error al restaurar");
      }
    } catch {
      toast.error("Error de red");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-muted/40 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Archive size={18} />
            </div>
            <DialogTitle className="text-base font-semibold">
              Archivo de Tareas & Limpieza de Trimestres
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex border-b px-6 bg-muted/20">
          <button
            onClick={() => setActiveTab("bulk_archive")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "bulk_archive"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Archivar tareas activas ({eligibleTasks.length})
          </button>
          <button
            onClick={() => setActiveTab("view_archived")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "view_archived"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Ver archivo y restaurar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === "bulk_archive" && (
            <div className="space-y-4">
              {/* Quick filters for archiving */}
              <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Filter size={13} />
                  <span>Criterios de archivo masivo</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2 pt-1">
                    <Checkbox
                      id="completed-only"
                      checked={onlyCompleted}
                      onCheckedChange={(c) => setOnlyCompleted(Boolean(c))}
                    />
                    <label
                      htmlFor="completed-only"
                      className="text-xs font-medium cursor-pointer"
                    >
                      Solo tareas completadas
                    </label>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Filtrar por Trimestre / Quarter
                    </label>
                    <Select
                      value={quarterFilter}
                      onValueChange={setQuarterFilter}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los trimestres</SelectItem>
                        {availableQuarters.map((q) => (
                          <SelectItem key={q} value={q}>
                            {q}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Task list preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <button
                    onClick={selectAllEligible}
                    className="font-medium text-primary hover:underline"
                  >
                    {selectedToArchive.length === eligibleTasks.length
                      ? "Desmarcar todas"
                      : "Seleccionar todas"}
                  </button>
                  <span className="text-muted-foreground tabular-nums">
                    {selectedToArchive.length > 0
                      ? `${selectedToArchive.length} seleccionadas`
                      : `${eligibleTasks.length} candidatas`}
                  </span>
                </div>

                {eligibleTasks.length === 0 ? (
                  <div className="text-center py-10 border rounded-xl bg-card space-y-2">
                    <CheckCircle2 size={24} className="text-emerald-500 mx-auto" />
                    <p className="text-xs text-muted-foreground">
                      No hay tareas que coincidan con los filtros de archivo seleccionados.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {eligibleTasks.map((t) => {
                      const isSelected = selectedToArchive.includes(t.id);
                      return (
                        <div
                          key={t.id}
                          onClick={() => toggleSelectToArchive(t.id)}
                          className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isSelected ? "bg-primary/5 border-primary/40" : "bg-card hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelectToArchive(t.id)}
                            />
                            <div className="truncate">
                              <span
                                className={`font-medium ${
                                  t.completed ? "line-through text-muted-foreground" : "text-foreground"
                                }`}
                              >
                                {t.title}
                              </span>
                              <span className="text-muted-foreground ml-2 text-[11px]">
                                ({t.listTitle})
                              </span>
                            </div>
                          </div>
                          {t.quarter && (
                            <Badge variant="outline" className="text-[10px] shrink-0 ml-2">
                              {t.quarter}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action bar */}
              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleBulkArchive}
                  disabled={actionLoading || eligibleTasks.length === 0}
                  className="gap-1.5"
                >
                  {actionLoading ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Archive size={13} />
                  )}
                  <span>
                    Archivar {selectedToArchive.length > 0 ? `(${selectedToArchive.length})` : `(${eligibleTasks.length})`}
                  </span>
                </Button>
              </div>
            </div>
          )}

          {activeTab === "view_archived" && (
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin text-muted-foreground" size={24} />
                </div>
              ) : archivedTasks.length === 0 ? (
                <div className="text-center py-12 border rounded-xl bg-card space-y-2">
                  <Archive size={24} className="text-muted-foreground mx-auto" />
                  <p className="text-sm font-medium">No hay tareas archivadas</p>
                  <p className="text-xs text-muted-foreground">
                    Las tareas que archives aparecerán aquí para que puedas consultarlas o restaurarlas en cualquier momento.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs pb-1">
                    <span className="text-muted-foreground">
                      {archivedTasks.length} tareas archivadas
                    </span>
                    {selectedToRestore.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestore(selectedToRestore)}
                        disabled={actionLoading}
                        className="h-7 text-xs gap-1"
                      >
                        <RotateCcw size={12} />
                        <span>Restaurar {selectedToRestore.length} seleccionadas</span>
                      </Button>
                    )}
                  </div>

                  <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                    {archivedTasks.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Checkbox
                            checked={selectedToRestore.includes(t.id)}
                            onCheckedChange={(c) => {
                              setSelectedToRestore((prev) =>
                                c ? [...prev, t.id] : prev.filter((id) => id !== t.id),
                              );
                            }}
                          />
                          <div className="space-y-0.5 truncate">
                            <p className="font-semibold text-foreground truncate">
                              {t.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                              <span>Lista: {t.list?.title || "General"}</span>
                              {t.quarter && <span>• {t.quarter}</span>}
                              {t.archivedAt && (
                                <span>
                                  • Archivado: {new Date(t.archivedAt).toLocaleDateString()}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRestore([t.id])}
                          disabled={actionLoading}
                          className="h-7 text-xs gap-1 shrink-0 ml-2 text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <RotateCcw size={12} />
                          <span>Restaurar</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
