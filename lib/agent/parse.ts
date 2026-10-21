import { cleanJsonString } from "@/lib/ai/engine";
import { McpWriteError } from "@/lib/mcp/writes";

// Parte pura del agente (sin base de datos), para poder probarla en unitarios.

export const KIKI_NAME = "Kiki";
export const KIKI_MODES = ["off", "owner", "member"] as const;
export type KikiMode = (typeof KIKI_MODES)[number];

export const MENTION = /(^|[\s(])@kiki\b/i;
export const hasKikiMention = (text: string) => MENTION.test(text);

export type Reply = { reply: string; summary: string; changes: Record<string, unknown> | null };

export function parseReply(raw: string): Reply {
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanJsonString(raw));
  } catch {
    // El modelo contestó en texto libre: se publica tal cual, sin cambios.
    return { reply: raw.trim().slice(0, 2000), summary: "", changes: null };
  }
  const obj = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  const changes = obj.changes && typeof obj.changes === "object" && !Array.isArray(obj.changes) ? (obj.changes as Record<string, unknown>) : null;
  return {
    reply: typeof obj.reply === "string" && obj.reply.trim() ? obj.reply.trim().slice(0, 4000) : "…",
    summary: typeof obj.summary === "string" ? obj.summary.trim().slice(0, 300) : "",
    changes: changes && Object.keys(changes).length ? changes : null,
  };
}

type Ref = { id: string };
export function buildPatch(
  raw: Record<string, unknown>,
  ref: {
    lists: Ref[];
    labels: Ref[];
    members: Ref[];
    task: { subtasks: { id: string; title: string; completed: boolean; order: number }[] };
  },
) {
  const patch: Record<string, unknown> = {};
  const known = (rows: Ref[], id: unknown) => typeof id === "string" && rows.some((r) => r.id === id);
  for (const key of ["title", "description", "priority", "startDate", "dueDate", "completed"] as const) if (key in raw) patch[key] = raw[key];
  if ("listId" in raw) {
    if (!known(ref.lists, raw.listId)) throw new McpWriteError("unknown list");
    patch.listId = raw.listId;
  }
  if ("assigneeId" in raw) {
    if (raw.assigneeId !== null && !known(ref.members, raw.assigneeId)) throw new McpWriteError("unknown member");
    patch.assigneeId = raw.assigneeId;
  }
  if ("labelIds" in raw) {
    if (!Array.isArray(raw.labelIds) || !raw.labelIds.every((id) => known(ref.labels, id))) throw new McpWriteError("unknown label");
    patch.labelIds = [...new Set(raw.labelIds as string[])];
  }
  if (Array.isArray(raw.addSubtasks) && raw.addSubtasks.length) {
    const titles = raw.addSubtasks.filter((t): t is string => typeof t === "string" && !!t.trim()).slice(0, 20);
    const existing = ref.task.subtasks;
    patch.subtasks = [
      ...existing.map((s) => ({ id: s.id, title: s.title, completed: s.completed, order: s.order })),
      ...titles.map((title, i) => ({ title: title.trim().slice(0, 300), completed: false, order: existing.length + i })),
    ];
  }
  return Object.keys(patch).length ? patch : null;
}

export type Triage = {
  reply: string;
  changes: { priority?: string | null; labelIds?: string[]; assigneeId?: string | null } | null;
  duplicates: string[];
};

const PRIORITIES = ["urgent", "high", "medium", "low"];

type TriageRef = { labels: Ref[]; members: Ref[]; candidates: Ref[]; currentPriority: string | null; hasAssignee: boolean };

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(cleanJsonString(raw));
  } catch {
    return null;
  }
}

// Valida la propuesta de un ticket contra lo que se le ofreció al modelo: prioridad
// de la lista cerrada, etiquetas y responsable solo si existen en el tablero, y
// duplicados solo entre los tickets candidatos.
export function triageFromObject(parsed: unknown, ref: TriageRef): Triage | null {
  const obj = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  const changes: NonNullable<Triage["changes"]> = {};
  if (typeof obj.priority === "string" && PRIORITIES.includes(obj.priority) && !ref.currentPriority) changes.priority = obj.priority;
  if (Array.isArray(obj.labelIds)) {
    const ids = [...new Set(obj.labelIds.filter((id): id is string => typeof id === "string" && ref.labels.some((l) => l.id === id)))];
    if (ids.length) changes.labelIds = ids.slice(0, 5);
  }
  if (typeof obj.assigneeId === "string" && !ref.hasAssignee && ref.members.some((m) => m.id === obj.assigneeId)) changes.assigneeId = obj.assigneeId;
  const duplicates = Array.isArray(obj.duplicateOf)
    ? [...new Set(obj.duplicateOf.filter((id): id is string => typeof id === "string" && ref.candidates.some((c) => c.id === id)))].slice(0, 3)
    : [];
  const reply = typeof obj.reply === "string" ? obj.reply.trim().slice(0, 1500) : "";
  const hasChanges = Object.keys(changes).length > 0;
  if (!reply || (!hasChanges && !duplicates.length)) return null;
  return { reply, changes: hasChanges ? changes : null, duplicates };
}

export function parseTriage(raw: string, ref: TriageRef): Triage | null {
  return triageFromObject(parseJson(raw), ref);
}

// Triage de un lote (Brain Dump): `{"tickets":[{"id", ...}]}`. Solo cuentan los ids del lote.
export function parseBatchTriage(raw: string, ids: string[], refFor: (id: string) => TriageRef): Map<string, Triage> {
  const parsed = parseJson(raw);
  const list = parsed && typeof parsed === "object" && Array.isArray((parsed as { tickets?: unknown }).tickets) ? (parsed as { tickets: unknown[] }).tickets : [];
  const result = new Map<string, Triage>();
  for (const item of list) {
    const id = item && typeof item === "object" ? (item as { id?: unknown }).id : undefined;
    if (typeof id !== "string" || !ids.includes(id) || result.has(id)) continue;
    const triage = triageFromObject(item, refFor(id));
    if (triage) result.set(id, triage);
  }
  return result;
}
