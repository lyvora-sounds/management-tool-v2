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
