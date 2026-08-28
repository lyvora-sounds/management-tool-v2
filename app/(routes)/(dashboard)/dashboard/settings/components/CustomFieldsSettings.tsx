"use client";

import { useEffect, useState } from "react";
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  Edit2,
  Shield,
  ShieldAlert,
  Loader2,
  Check,
  X,
  LayoutGrid,
  ListFilter,
  Sparkles,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/Shared/ModalDeleteConfirmation/ModalDeleteConfirmation";

interface BoardOption {
  id: string;
  title: string;
  color: string | null;
  isOwner: boolean;
  isAdmin: boolean;
}

export interface CustomFieldItem {
  id: string;
  boardId: string;
  name: string;
  type: "NUMBER" | "TEXT" | "SELECT";
  options: string[] | null;
  enabled: boolean;
  isDefault: boolean;
  defaultKey: string | null;
  order: number;
}

export function CustomFieldsSettings() {
  const [boards, setBoards] = useState<BoardOption[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const [customFields, setCustomFields] = useState<CustomFieldItem[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const [loadingBoards, setLoadingBoards] = useState(true);
  const [loadingFields, setLoadingFields] = useState(false);
  const [savingFieldId, setSavingFieldId] = useState<string | null>(null);

  // Create / Edit Modal state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldItem | null>(null);
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState<"NUMBER" | "TEXT" | "SELECT">("TEXT");
  const [fieldOptionsStr, setFieldOptionsStr] = useState("");
  const [fieldEnabled, setFieldEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deletingField, setDeletingField] = useState<CustomFieldItem | null>(null);

  useEffect(() => {
    fetchBoards();
  }, []);

  useEffect(() => {
    if (selectedBoardId) {
      fetchCustomFields(selectedBoardId);
    }
  }, [selectedBoardId]);

  const fetchBoards = async () => {
    try {
      setLoadingBoards(true);
      const res = await fetch("/api/settings/custom-fields/boards");
      if (res.ok) {
        const data: BoardOption[] = await res.json();
        setBoards(data);
        if (data.length > 0) {
          setSelectedBoardId(data[0].id);
        }
      }
    } catch {
      toast.error("Error al cargar los boards.");
    } finally {
      setLoadingBoards(false);
    }
  };

  const fetchCustomFields = async (boardId: string) => {
    try {
      setLoadingFields(true);
      const res = await fetch(`/api/settings/custom-fields?boardId=${boardId}`);
      if (res.ok) {
        const data = await res.json();
        setCustomFields(data.customFields || []);
        setIsAdmin(data.isAdmin);
      }
    } catch {
      toast.error("Error al cargar los campos personalizados.");
    } finally {
      setLoadingFields(false);
    }
  };

  const handleToggleEnabled = async (field: CustomFieldItem) => {
    if (!isAdmin) return;
    const nextState = !field.enabled;

    // Optimistic UI update
    setCustomFields((prev) =>
      prev.map((f) => (f.id === field.id ? { ...f, enabled: nextState } : f))
    );
    setSavingFieldId(field.id);

    try {
      const res = await fetch(`/api/settings/custom-fields/${field.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextState }),
      });

      if (!res.ok) {
        // Revert on error
        setCustomFields((prev) =>
          prev.map((f) => (f.id === field.id ? { ...f, enabled: field.enabled } : f))
        );
        toast.error("No se pudo actualizar el campo.");
      }
    } catch {
      setCustomFields((prev) =>
        prev.map((f) => (f.id === field.id ? { ...f, enabled: field.enabled } : f))
      );
      toast.error("Error de red.");
    } finally {
      setSavingFieldId(null);
    }
  };

  const openCreateDialog = () => {
    setEditingField(null);
    setFieldName("");
    setFieldType("TEXT");
    setFieldOptionsStr("");
    setFieldEnabled(true);
    setDialogOpen(true);
  };

  const openEditDialog = (field: CustomFieldItem) => {
    setEditingField(field);
    setFieldName(field.name);
    setFieldType(field.type);
    setFieldOptionsStr(Array.isArray(field.options) ? field.options.join(", ") : "");
    setFieldEnabled(field.enabled);
    setDialogOpen(true);
  };

  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldName.trim()) {
      toast.error("Escribe un nombre para el campo.");
      return;
    }

    const optionsArray =
      fieldType === "SELECT"
        ? fieldOptionsStr
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : null;

    if (fieldType === "SELECT" && (!optionsArray || optionsArray.length === 0)) {
      toast.error("Debes añadir al menos una opción para el campo de tipo Lista.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingField) {
        // Update existing field
        const res = await fetch(`/api/settings/custom-fields/${editingField.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: fieldName.trim(),
            type: fieldType,
            options: optionsArray,
            enabled: fieldEnabled,
          }),
        });

        if (res.ok) {
          const updated = await res.json();
          setCustomFields((prev) =>
            prev.map((f) => (f.id === updated.id ? updated : f))
          );
          toast.success("Campo actualizado correctamente.");
          setDialogOpen(false);
        } else {
          const data = await res.json();
          toast.error(data.error || "Error al actualizar campo.");
        }
      } else {
        // Create new custom field
        const res = await fetch("/api/settings/custom-fields", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            boardId: selectedBoardId,
            name: fieldName.trim(),
            type: fieldType,
            options: optionsArray,
            enabled: fieldEnabled,
          }),
        });

        if (res.ok) {
          const created = await res.json();
          setCustomFields((prev) => [...prev, created]);
          toast.success("Campo personalizado creado.");
          setDialogOpen(false);
        } else {
          const data = await res.json();
          toast.error(data.error || "Error al crear campo.");
        }
      }
    } catch {
      toast.error("Error de red.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    try {
      const res = await fetch(`/api/settings/custom-fields/${fieldId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCustomFields((prev) => prev.filter((f) => f.id !== fieldId));
        toast.success("Campo eliminado.");
      } else {
        const data = await res.json();
        toast.error(data.error || "Error al eliminar campo.");
      }
    } catch {
      toast.error("Error de red al eliminar.");
    } finally {
      setDeletingField(null);
    }
  };

  const selectedBoard = boards.find((b) => b.id === selectedBoardId);
  const defaultFields = customFields.filter((f) => f.isDefault);
  const userCustomFields = customFields.filter((f) => !f.isDefault);

  if (loadingBoards) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="animate-spin text-muted-foreground" size={28} />
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center space-y-3">
        <LayoutGrid size={36} className="mx-auto text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold">No se encontraron boards</h3>
        <p className="text-sm text-muted-foreground">
          Crea o únete a un board para configurar sus valores personalizados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Board Selector */}
      <div className="rounded-xl border bg-card p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <SlidersHorizontal size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Configuración por Board</h2>
              <p className="text-xs text-muted-foreground">
                Selecciona un board para gestionar sus campos y valores personalizados.
              </p>
            </div>
          </div>

          {/* Admin Role Status Badge */}
          {selectedBoard && (
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1.5 py-1 px-3">
                  <Shield size={13} />
                  <span>Administrador</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/20 gap-1.5 py-1 px-3">
                  <ShieldAlert size={13} />
                  <span>Solo lectura</span>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Boards Selector Tabs/Dropdown */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0 mr-2">
            Board activo:
          </Label>
          <div className="flex flex-wrap gap-2 flex-1">
            {boards.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBoardId(b.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  selectedBoardId === b.id
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-background hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {b.color && (
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: b.color }}
                  />
                )}
                <span className="truncate max-w-40">{b.title}</span>
                {b.isAdmin && (
                  <span className="text-[10px] opacity-75 bg-black/10 dark:bg-white/10 px-1 rounded">
                    Admin
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {!isAdmin && (
          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-lg">
            <Info size={14} className="shrink-0" />
            <span>
              Solo los administradores del board pueden editar o crear campos personalizados. Puedes ver la lista activa.
            </span>
          </div>
        )}
      </div>

      {/* Content Container */}
      {loadingFields ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Default Custom Fields Section */}
          <div className="rounded-xl border bg-card p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <Sparkles size={16} className="text-primary" />
                  <span>Campos Por Defecto del Sistema</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Campos estándar prediseñados (`Story points`, `Environment`, `Parent`, `Child`, `Customer`). Puedes habilitarlos o deshabilitarlos para los tickets.
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {defaultFields.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between p-3.5 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{field.name}</span>
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-semibold">
                        {field.type === "SELECT" ? "Lista" : field.type === "NUMBER" ? "Número" : "Texto"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        Por defecto
                      </Badge>
                    </div>
                    {field.options && field.options.length > 0 && (
                      <p className="text-xs text-muted-foreground truncate">
                        Opciones: <code className="text-[11px]">{field.options.join(", ")}</code>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {field.type === "SELECT" && isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(field)}
                        className="h-8 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 size={13} className="mr-1" />
                        Opciones
                      </Button>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {field.enabled ? "Habilitado" : "Deshabilitado"}
                      </span>
                      <Switch
                        checked={field.enabled}
                        disabled={!isAdmin || savingFieldId === field.id}
                        onCheckedChange={() => handleToggleEnabled(field)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Custom Fields Section */}
          <div className="rounded-xl border bg-card p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
              <div>
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <ListFilter size={16} className="text-primary" />
                  <span>Campos Personalizados Adicionales</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Campos propios creados a medida para este board.
                </p>
              </div>

              {isAdmin && (
                <Button onClick={openCreateDialog} size="sm" className="gap-1.5 text-xs">
                  <Plus size={15} />
                  <span>Añadir campo personalizado</span>
                </Button>
              )}
            </div>

            {userCustomFields.length === 0 ? (
              <div className="py-8 text-center border rounded-lg border-dashed text-muted-foreground space-y-1">
                <p className="text-sm font-medium">No hay campos personalizados adicionales creados.</p>
                <p className="text-xs">
                  Haz clic en &quot;Añadir campo personalizado&quot; para crear uno nuevo (ej. Prioridad Impacto, Cliente VIP, etc.).
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {userCustomFields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between p-3.5 rounded-lg border bg-background hover:border-primary/40 transition-all"
                  >
                    <div className="space-y-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{field.name}</span>
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-semibold">
                          {field.type === "SELECT" ? "Lista" : field.type === "NUMBER" ? "Número" : "Texto"}
                        </Badge>
                      </div>
                      {field.options && field.options.length > 0 && (
                        <p className="text-xs text-muted-foreground truncate">
                          Opciones: <code className="text-[11px]">{field.options.join(", ")}</code>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => openEditDialog(field)}
                            title="Editar campo"
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeletingField(field)}
                            title="Eliminar campo"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </>
                      )}

                      <div className="flex items-center gap-2 pl-2 border-l">
                        <Switch
                          checked={field.enabled}
                          disabled={!isAdmin || savingFieldId === field.id}
                          onCheckedChange={() => handleToggleEnabled(field)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Custom Field Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingField ? `Editar campo "${editingField.name}"` : "Nuevo campo personalizado"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveField} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nombre del campo</Label>
              <Input
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder="Ej. Story points, Ambiente, Cliente..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Tipo de dato</Label>
              <Select
                value={fieldType}
                onValueChange={(v) => setFieldType(v as "NUMBER" | "TEXT" | "SELECT")}
                disabled={Boolean(editingField && editingField.isDefault)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEXT">Texto plano</SelectItem>
                  <SelectItem value="NUMBER">Número</SelectItem>
                  <SelectItem value="SELECT">Lista de opciones (Desplegable)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {fieldType === "SELECT" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Opciones (separadas por comas)</Label>
                <Input
                  value={fieldOptionsStr}
                  onChange={(e) => setFieldOptionsStr(e.target.value)}
                  placeholder="ej. dev, integration, uat, production o 1, 2, 3, 5, 8"
                />
                <p className="text-xs text-muted-foreground">
                  Escribe los valores separados por comas que aparecerán en la lista.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Label className="text-sm font-medium">Habilitar en tickets</Label>
              <Switch checked={fieldEnabled} onCheckedChange={setFieldEnabled} />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 size={16} className="animate-spin" /> : "Guardar campo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={Boolean(deletingField)}
        title="Eliminar campo personalizado"
        description={`¿Estás seguro de eliminar el campo "${deletingField?.name}"? Se perderán los valores asignados a las tareas.`}
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={() => {
          if (deletingField) handleDeleteField(deletingField.id);
        }}
        onCancel={() => setDeletingField(null)}
      />
    </div>
  );
}
