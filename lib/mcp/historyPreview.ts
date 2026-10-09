// Shared by the history response and its client preview; no database imports.
export type HistoryValue = string | number | boolean | null | HistoryValue[] | { [key: string]: HistoryValue };
export type HistorySnapshot = { id: string; title: string; [key: string]: HistoryValue };
export type HistoryNames = {
  listNames: Record<string, string>;
  userNames?: Record<string, string>;
  labelNames?: Record<string, string>;
  epicNames?: Record<string, string>;
  customFieldNames?: Record<string, string>;
};

function canonical(value: HistoryValue | undefined): string | undefined {
  return JSON.stringify(value, (_key, item) => item && typeof item === "object" && !Array.isArray(item)
    ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);
}

export function changedHistoryFields(before: HistorySnapshot, after: HistorySnapshot): string[] {
  // Only compare fields present in the journal being restored. Legacy journals
  // omitted the new fields, and task revisions are never restored.
  return Object.keys(before).filter(field => field !== "id" && field !== "updatedAt" && canonical(before[field]) !== canonical(after[field]));
}

function rows(value: HistoryValue | undefined): { [key: string]: HistoryValue }[] {
  return Array.isArray(value) ? value.filter((row): row is { [key: string]: HistoryValue } => !!row && typeof row === "object" && !Array.isArray(row)) : [];
}

export function historyUserIds(snapshots: HistorySnapshot[]): string[] {
  return [...new Set(snapshots.flatMap(snapshot => [snapshot.assigneeId, snapshot.qaId, snapshot.completedById,
    ...rows(snapshot.collaborators).map(row => row.userId), ...rows(snapshot.comments).map(row => row.userId)]
    .filter((value): value is string => typeof value === "string" && !!value)))];
}

export function formatHistoryValue(field: string, raw: HistoryValue | undefined, names: HistoryNames, t: (key: "sharingEnabled" | "sharingDisabled" | "yes" | "no" | "missingList" | "bytes") => string): string {
  if (field === "shareToken") return t(raw ? "sharingEnabled" : "sharingDisabled");
  if (raw === null || raw === undefined) return "—";
  if (typeof raw === "boolean") return t(raw ? "yes" : "no");
  if (field === "listId") return names.listNames[String(raw)] ?? t("missingList");
  if (["assigneeId", "qaId", "completedById"].includes(field)) return names.userNames?.[String(raw)] ?? String(raw);
  if (field === "epicId") return names.epicNames?.[String(raw)] ?? String(raw);
  if (Array.isArray(raw)) {
    if (!raw.length) return "—";
    return rows(raw).map(row => {
      if (field === "collaborators") return names.userNames?.[String(row.userId)] ?? String(row.userId);
      if (field === "labels") return names.labelNames?.[String(row.labelId)] ?? String(row.labelId);
      if (field === "customValues") return `${names.customFieldNames?.[String(row.customFieldId)] ?? row.customFieldId}: ${row.value ?? "—"}`;
      if (field === "subtasks") return `${Number(row.order) + 1}. ${row.completed ? "☑" : "☐"} ${row.title}`;
      if (field === "comments") return `${names.userNames?.[String(row.userId)] ?? row.userId}: ${row.content}`;
      if (field === "attachments") return `${row.filename} (${row.size} ${t("bytes")})`;
      return JSON.stringify(row, null, 2);
    }).join("\n");
  }
  return typeof raw === "object" ? JSON.stringify(raw, null, 2) : String(raw);
}

export function historyRelationImpact(field: string, before: HistoryValue, after: HistoryValue) {
  const key = field === "collaborators" ? "userId" : field === "labels" ? "labelId" : field === "customValues" ? "customFieldId" : "id";
  const previous = new Map(rows(before).map(row => [String(row[key]), row]));
  const current = new Map(rows(after).map(row => [String(row[key]), row]));
  return {
    removed: [...current.keys()].filter(id => !previous.has(id)).length,
    restored: [...previous.keys()].filter(id => !current.has(id)).length,
    changed: [...previous.keys()].filter(id => current.has(id) && canonical(previous.get(id)) !== canonical(current.get(id))).length,
  };
}
