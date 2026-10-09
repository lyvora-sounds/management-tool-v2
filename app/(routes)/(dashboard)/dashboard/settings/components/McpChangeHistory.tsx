"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { changedHistoryFields, formatHistoryValue, historyRelationImpact, type HistoryNames, type HistorySnapshot } from "@/lib/mcp/historyPreview";
import { Button } from "@/components/ui/button";

type Change = { id: string; kind: string; summary: string; createdAt: string; revertedAt: string | null };
type Detail = HistoryNames & { id: string; kind: string; summary: string; before: HistorySnapshot[]; after: HistorySnapshot[] };

export function McpChangeHistory({ organizationId, boardId }: { organizationId: string; boardId: string | null }) {
  const t = useTranslations("mcpHistory");
  const [changes, setChanges] = useState<Change[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const params = new URLSearchParams({ organizationId });
  if (boardId) params.set("boardId", boardId);
  const url = `/api/settings/mcp/history?${params}`;

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError(false);
    try {
      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error("load");
      const data = await response.json();
      if (!signal?.aborted) setChanges(data);
    } catch { if (!signal?.aborted) setError(true); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [url]);

  useEffect(() => {
    const controller = new AbortController();
    setDetail(null); setChanges([]); void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function preview(id: string) {
    setBusy(true);
    try {
      const response = await fetch(`${url}&changeId=${encodeURIComponent(id)}`);
      if (!response.ok) throw new Error("preview");
      setDetail(await response.json());
    } catch { toast.error(t("loadError")); }
    finally { setBusy(false); }
  }

  async function revert() {
    if (!detail) return;
    setBusy(true);
    try {
      const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ changeId: detail.id, confirm: true }) });
      if (!response.ok) throw new Error("revert");
      setDetail(null); toast.success(t("reverted")); await load();
    } catch { toast.error(t("conflict")); }
    finally { setBusy(false); }
  }

  function fieldLabel(field: string) {
    const key = `fields.${field}` as Parameters<typeof t>[0];
    return t.has(key) ? t(key) : field;
  }

  return <section className="rounded-xl border bg-card p-5 space-y-4">
    <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">{t("title")}</h3><Button type="button" size="sm" variant="outline" disabled={loading || busy} onClick={() => load()}>{t("refresh")}</Button></div>
    <p className="text-sm text-muted-foreground">{t("description")}</p>
    {loading ? <p className="text-sm">{t("loading")}</p> : error ? <p className="text-sm">{t("loadError")}</p> : changes.length === 0 ? <p className="text-sm text-muted-foreground">{t("empty")}</p> : <ul className="space-y-2">
      {changes.map((change) => <li key={change.id} className="flex items-start justify-between gap-3 rounded-lg border p-3"><div className="min-w-0"><p className="break-words text-sm font-medium">{change.summary}</p><p className="text-xs text-muted-foreground">{new Date(change.createdAt).toLocaleString()}{change.revertedAt ? ` · ${t("revertedLabel")}` : ""}</p></div><Button type="button" size="sm" variant="outline" disabled={busy || !!change.revertedAt} onClick={() => preview(change.id)}>{t("preview")}</Button></li>)}
    </ul>}
    {detail && <div className="rounded-lg border border-amber-300 p-4 space-y-3">
      <h4 className="font-semibold">{t("previewTitle")}</h4><p className="text-sm text-muted-foreground">{t("previewHint")}</p>
      {detail.after.map((after) => {
        const before = detail.before.find((item) => item.id === after.id);
        return <div key={after.id} className="rounded border p-3 space-y-2">
          <p className="text-sm font-medium">{after.title}</p>
          {!before ? <p className="text-sm">{t("archiveCreated")}</p> : changedHistoryFields(before, after).map(field => <div key={field} className="text-sm space-y-1">
            <p className="font-medium">{fieldLabel(field)}</p>
            {field === "shareToken" && before[field] && after[field] ? <p className="text-muted-foreground">{t("sharingLinkChanged")}</p> : null}
            {Array.isArray(before[field]) && Array.isArray(after[field]) ? <p className="text-xs text-muted-foreground">{t("relationImpact", historyRelationImpact(field, before[field], after[field]))}</p> : null}
            <div className="grid gap-2 sm:grid-cols-2">
              <div><p className="text-xs font-medium">{t("currentValue")}</p><p className="max-h-48 overflow-auto whitespace-pre-wrap break-words text-muted-foreground">{formatHistoryValue(field, after[field], detail, key => t(key))}</p></div>
              <div><p className="text-xs font-medium">{t("restoredValue")}</p><p className="max-h-48 overflow-auto whitespace-pre-wrap break-words text-muted-foreground">{formatHistoryValue(field, before[field], detail, key => t(key))}</p></div>
            </div>
          </div>)}
        </div>;
      })}
      <div className="flex flex-wrap gap-2"><Button type="button" disabled={busy} onClick={revert}>{t("confirmRevert")}</Button><Button type="button" disabled={busy} variant="outline" onClick={() => setDetail(null)}>{t("cancel")}</Button></div>
    </div>}
  </section>;
}
