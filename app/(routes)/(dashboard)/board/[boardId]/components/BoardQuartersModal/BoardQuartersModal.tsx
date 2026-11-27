"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarRange, Loader2, RotateCcw } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  type BoardQuarterDto,
  defaultQuarterRows,
  quarterYearsAroundCurrent,
} from "@/lib/boardQuarters";

type DraftRow = { key: string; startDate: string; endDate: string };

function toDateInputValue(iso: string) {
  return iso.slice(0, 10);
}

function fromDateInputValue(day: string, endOfDay: boolean) {
  return endOfDay ? `${day}T23:59:59.999Z` : `${day}T00:00:00.000Z`;
}

function mergeYears(existing: BoardQuarterDto[], years: number[]): DraftRow[] {
  const byKey = new Map(existing.map((row) => [row.key, row]));
  for (const year of years) {
    for (const row of defaultQuarterRows(year)) {
      if (!byKey.has(row.key)) byKey.set(row.key, row);
    }
  }
  return [...byKey.values()]
    .map((row) => ({ key: row.key, startDate: row.startDate, endDate: row.endDate }))
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.key.localeCompare(b.key));
}

function endBeforeStart(row: DraftRow) {
  return new Date(row.endDate).getTime() < new Date(row.startDate).getTime();
}

interface BoardQuartersModalProps {
  boardId: string;
  canManage: boolean;
  open: boolean;
  onClose: () => void;
  onSaved?: (quarters: BoardQuarterDto[]) => void;
}

export function BoardQuartersModal({
  boardId,
  canManage,
  open,
  onClose,
  onSaved,
}: BoardQuartersModalProps) {
  const t = useTranslations("quarters");
  const tCommon = useTranslations("common");
  const years = useMemo(() => quarterYearsAroundCurrent(), []);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [year, setYear] = useState(years[1] ?? new Date().getUTCFullYear());
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [loaded, setLoaded] = useState<BoardQuarterDto[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/boards/${boardId}/quarters`);
        if (!res.ok) throw new Error("load");
        const data = (await res.json()) as { quarters: BoardQuarterDto[] };
        if (cancelled) return;
        setLoaded(data.quarters);
        setRows(mergeYears(data.quarters, years));
      } catch {
        if (!cancelled) toast.error(t("loadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, boardId, t, years]);

  const updateRow = (key: string, patch: Partial<DraftRow>) => {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const resetYearToCalendar = () => {
    const defaults = defaultQuarterRows(year);
    setRows((prev) => {
      const others = prev.filter((row) => !row.key.startsWith(`${year}-`));
      return [...others, ...defaults].sort(
        (a, b) => a.startDate.localeCompare(b.startDate) || a.key.localeCompare(b.key),
      );
    });
  };

  const yearRows = rows.filter((row) => row.key.startsWith(`${year}-`));
  const hasInvalidRange = yearRows.some(endBeforeStart);

  const putYearRows = async (payload: DraftRow[]) => {
    setSaving(true);
    try {
      const res = await apiFetch(`/api/boards/${boardId}/quarters`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quarters: payload }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        toast.error(body?.message || t("saveError"));
        return false;
      }
      const data = (await res.json()) as { quarters: BoardQuarterDto[] };
      setLoaded(data.quarters);
      setRows((prev) => {
        const byKey = new Map(prev.map((row) => [row.key, row]));
        for (const row of data.quarters) {
          byKey.set(row.key, { key: row.key, startDate: row.startDate, endDate: row.endDate });
        }
        return [...byKey.values()].sort(
          (a, b) => a.startDate.localeCompare(b.startDate) || a.key.localeCompare(b.key),
        );
      });
      onSaved?.(data.quarters);
      toast.success(t("saved"));
      return true;
    } catch {
      toast.error(t("saveError"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const ensureYear = async () => {
    if (!canManage) return;
    const onServer = new Set(loaded.map((row) => row.key));
    const missingDefaults = defaultQuarterRows(year).filter((row) => !onServer.has(row.key));
    if (missingDefaults.length === 0) {
      setRows((prev) => mergeYears(prev, [year]));
      return;
    }
    const localByKey = new Map(rows.map((row) => [row.key, row]));
    const payload = missingDefaults.map((row) => localByKey.get(row.key) ?? row);
    await putYearRows(payload);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage || hasInvalidRange) return;
    for (const row of yearRows) {
      if (endBeforeStart(row)) {
        toast.error(t("endBeforeStart", { key: row.key }));
        return;
      }
    }
    await putYearRows(yearRows);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarRange size={18} />
            {t("title")}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{t("hint")}</p>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quarter-year">{t("year")}</Label>
              <select
                id="quarter-year"
                className="h-9 rounded-md border bg-background px-2 text-sm"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void ensureYear()}
              disabled={!canManage || saving}
            >
              {t("ensureYear")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={resetYearToCalendar}
              disabled={!canManage}
            >
              <RotateCcw size={14} />
              {t("resetCalendar")}
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8 text-muted-foreground">
              <Loader2 className="animate-spin" size={20} />
            </div>
          ) : (
            <div className="space-y-3">
              {yearRows.map((row) => (
                <div key={row.key} className="grid grid-cols-[5rem_1fr_1fr] gap-2 items-end">
                  <div className="text-sm font-semibold pb-2">{row.key}</div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">{t("start")}</Label>
                    <Input
                      type="date"
                      value={toDateInputValue(row.startDate)}
                      disabled={!canManage}
                      onChange={(e) =>
                        updateRow(row.key, { startDate: fromDateInputValue(e.target.value, false) })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">{t("end")}</Label>
                    <Input
                      type="date"
                      value={toDateInputValue(row.endDate)}
                      disabled={!canManage}
                      onChange={(e) =>
                        updateRow(row.key, { endDate: fromDateInputValue(e.target.value, true) })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              {tCommon("cancel")}
            </Button>
            {canManage && (
              <Button type="submit" disabled={saving || loading || hasInvalidRange}>
                {saving ? <Loader2 className="animate-spin" size={16} /> : tCommon("save")}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
