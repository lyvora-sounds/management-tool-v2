"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal, Loader2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { TicketSelectCombobox } from "./TicketSelectCombobox";

interface CustomField {
  id: string;
  name: string;
  type: "NUMBER" | "TEXT" | "SELECT";
  options: string[] | null;
  defaultKey: string | null;
}

interface CustomFieldValue {
  id: string;
  customFieldId: string;
  value: string | null;
}

interface TaskCustomFieldsProps {
  taskId: string;
  boardId: string;
}

export function TaskCustomFields({ taskId, boardId }: TaskCustomFieldsProps) {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingFieldId, setSavingFieldId] = useState<string | null>(null);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);

  useEffect(() => {
    fetchTaskCustomValues();
  }, [taskId]);

  const fetchTaskCustomValues = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tasks/${taskId}/custom-values`);
      if (res.ok) {
        const data = await res.json();
        setFields(data.fields || []);

        const valMap: Record<string, string> = {};
        (data.values || []).forEach((v: CustomFieldValue) => {
          if (v.value !== null) {
            valMap[v.customFieldId] = v.value;
          }
        });
        setValues(valMap);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSaveValue = async (customFieldId: string, newValue: string) => {
    const currentValue = values[customFieldId] ?? "";
    if (newValue === currentValue) return;

    setSavingFieldId(customFieldId);
    setValues((prev) => ({ ...prev, [customFieldId]: newValue }));

    try {
      const res = await fetch(`/api/tasks/${taskId}/custom-values`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customFieldId, value: newValue }),
      });

      if (res.ok) {
        setSavedSuccessId(customFieldId);
        setTimeout(() => setSavedSuccessId(null), 2000);
      } else {
        toast.error("Error al guardar el valor personalizado.");
      }
    } catch {
      toast.error("Error de red.");
    } finally {
      setSavingFieldId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
        <Loader2 size={14} className="animate-spin" />
        <span>Cargando valores personalizados...</span>
      </div>
    );
  }

  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-muted/20 p-3.5 space-y-3">
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <SlidersHorizontal size={14} className="text-primary" />
          <span>Valores Personalizados</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((field) => {
          const val = values[field.id] ?? "";
          const isSaving = savingFieldId === field.id;
          const isSuccess = savedSuccessId === field.id;

          const isTicketRef =
            field.defaultKey === "parent" ||
            field.defaultKey === "child" ||
            /parent|child|padre|hijo/i.test(field.name);

          return (
            <div key={field.id} className="space-y-1 min-w-0">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-foreground truncate">
                  {field.name}
                </Label>
                {isSaving ? (
                  <Loader2 size={12} className="animate-spin text-muted-foreground shrink-0" />
                ) : isSuccess ? (
                  <Check size={12} className="text-emerald-500 shrink-0" />
                ) : null}
              </div>

              {isTicketRef ? (
                <TicketSelectCombobox
                  value={val}
                  onSelect={(newVal) => handleSaveValue(field.id, newVal)}
                  currentTaskId={taskId}
                  boardId={boardId}
                  isMulti={field.defaultKey === "child" || /child|hijo/i.test(field.name)}
                  placeholder={
                    field.defaultKey === "parent"
                      ? "Seleccionar ticket o Epic padre..."
                      : "Seleccionar ticket(s) hijo(s)..."
                  }
                />
              ) : field.type === "SELECT" && field.options && field.options.length > 0 ? (
                <Select
                  value={val}
                  onValueChange={(v) => handleSaveValue(field.id, !v || v === "none" ? "" : v)}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs text-muted-foreground">
                      Sin especificar
                    </SelectItem>
                    {field.options.map((opt) => (
                      <SelectItem key={opt} value={opt} className="text-xs">
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === "NUMBER" ? (
                <Input
                  type="number"
                  value={val}
                  onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}
                  onBlur={(e) => handleSaveValue(field.id, e.target.value)}
                  placeholder="Ej. 1, 2, 5..."
                  className="h-8 text-xs bg-background"
                />
              ) : (
                <Input
                  type="text"
                  value={val}
                  onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}
                  onBlur={(e) => handleSaveValue(field.id, e.target.value)}
                  placeholder={
                    field.defaultKey === "customer"
                      ? "ej. Nombre del cliente"
                      : "Escribe un valor..."
                  }
                  className="h-8 text-xs bg-background"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
