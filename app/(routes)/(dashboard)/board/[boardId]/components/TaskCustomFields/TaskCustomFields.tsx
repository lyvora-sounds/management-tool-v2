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
import { useTranslations } from "next-intl";
import { TicketSelectCombobox } from "./TicketSelectCombobox";
import { isChildFieldKey, isTicketRefKey } from "@/lib/customFieldsDefaults";
import { useBoardAccess } from "../BoardAccess";
import { apiFetch } from "@/lib/apiClient";

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
  onTicketLinkChange?: () => void;
}

const FIELD_ORDER = ["story_points", "environment", "parent", "child", "customer"];

function fieldOrder(field: CustomField) {
  const index = FIELD_ORDER.indexOf(field.defaultKey ?? "");
  return index === -1 ? FIELD_ORDER.length : index;
}

export function TaskCustomFields({ taskId, boardId, onTicketLinkChange }: TaskCustomFieldsProps) {
  const t = useTranslations("task");
  const tCommon = useTranslations("common");
  const { canEdit } = useBoardAccess();
  const [fields, setFields] = useState<CustomField[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  // Último valor confirmado por el servidor. `values` refleja lo que se está
  // escribiendo en el input, así que no sirve para decidir si hay cambios:
  // al llegar el onBlur ya contiene el texto nuevo.
  const [savedValues, setSavedValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingFieldId, setSavingFieldId] = useState<string | null>(null);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTaskCustomValues = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/api/tasks/${taskId}/custom-values`);
        if (!res.ok) return;
        const data = await res.json();
        setFields(data.fields || []);

        const valMap: Record<string, string> = {};
        (data.values || []).forEach((v: CustomFieldValue) => {
          if (v.value !== null) {
            valMap[v.customFieldId] = v.value;
          }
        });
        setValues(valMap);
        setSavedValues(valMap);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetchTaskCustomValues();
  }, [taskId]);

  const handleSaveValue = async (customFieldId: string, newValue: string) => {
    if (!canEdit) return;
    const previous = savedValues[customFieldId] ?? "";
    if (newValue === previous) return;

    setSavingFieldId(customFieldId);
    setValues((prev) => ({ ...prev, [customFieldId]: newValue }));

    try {
      const res = await apiFetch(`/api/tasks/${taskId}/custom-values`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customFieldId, value: newValue }),
      });

      if (res.ok) {
        setSavedValues((prev) => ({ ...prev, [customFieldId]: newValue }));
        setSavedSuccessId(customFieldId);
        setTimeout(() => setSavedSuccessId(null), 2000);
        if (isTicketRefKey(fields.find((field) => field.id === customFieldId)?.defaultKey)) {
          onTicketLinkChange?.();
        }
      } else {
        setValues((prev) => ({ ...prev, [customFieldId]: previous }));
        toast.error(t("saveCustomValueError"));
      }
    } catch {
      setValues((prev) => ({ ...prev, [customFieldId]: previous }));
      toast.error(tCommon("connectionError"));
    } finally {
      setSavingFieldId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
        <Loader2 size={14} className="animate-spin" />
        <span>{t("loadingCustomValues")}</span>
      </div>
    );
  }

  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="@container rounded-xl border bg-background p-3.5 space-y-3">
      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <SlidersHorizontal size={15} className="text-muted-foreground" />
        <span>{t("customFields")}</span>
      </div>

      <div className="grid grid-cols-1 gap-3 @min-[28rem]:grid-cols-2 @min-[44rem]:grid-cols-[6.25rem_10rem_minmax(8.75rem,1fr)_minmax(8.75rem,1fr)_minmax(8.75rem,1fr)]">
        {[...fields].sort((a, b) => fieldOrder(a) - fieldOrder(b)).map((field) => {
          const val = values[field.id] ?? "";
          const isSaving = savingFieldId === field.id;
          const isSuccess = savedSuccessId === field.id;
          const isTicketRef = isTicketRefKey(field.defaultKey);

          return (
            <div key={field.id} className="min-w-0 space-y-1.5">
              <div className="flex items-center justify-between gap-1">
                <Label className="truncate text-xs font-medium text-muted-foreground">
                  {field.name}
                </Label>
                {isSaving ? (
                  <Loader2 size={12} className="animate-spin text-muted-foreground shrink-0" />
                ) : isSuccess ? (
                  <Check size={12} className="text-emerald-500 shrink-0" />
                ) : null}
              </div>

              {!canEdit ? (
                <p className="text-xs text-foreground min-h-8 flex items-center">{val || t("unspecified")}</p>
              ) : isTicketRef ? (
                <TicketSelectCombobox
                  value={val}
                  onSelect={(newVal) => handleSaveValue(field.id, newVal)}
                  currentTaskId={taskId}
                  boardId={boardId}
                  isMulti={isTicketRefKey(field.defaultKey)}
                  placeholder={
                    isChildFieldKey(field.defaultKey)
                      ? t("selectChildren")
                      : t("selectParent")
                  }
                />
              ) : field.type === "SELECT" && field.options && field.options.length > 0 ? (
                <Select
                  value={val}
                  onValueChange={(v) => handleSaveValue(field.id, !v || v === "none" ? "" : v)}
                >
                  <SelectTrigger className="h-8 w-full min-w-0 bg-background text-sm">
                    <SelectValue placeholder={t("select")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs text-muted-foreground">
                      {t("unspecified")}
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
                  placeholder={t("numberPlaceholder")}
                  className="h-8 bg-background text-sm"
                />
              ) : (
                <Input
                  type="text"
                  value={val}
                  onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}
                  onBlur={(e) => handleSaveValue(field.id, e.target.value)}
                  placeholder={
                    field.defaultKey === "customer"
                      ? t("customerPlaceholder")
                      : t("valuePlaceholder")
                  }
                  className="h-8 bg-background text-sm"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
