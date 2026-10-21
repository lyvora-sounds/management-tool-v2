export type AiProvider =
  | "openai"
  | "claude"
  | "gemini"
  | "grok"
  | "deepseek"
  | "kimi"
  | "custom";

export interface AiCredentials {
  provider: AiProvider;
  apiKey: string;
  model?: string | null;
  baseUrl?: string | null;
}

export interface ParsedSubtask {
  title: string;
}

export interface ParsedTask {
  title: string;
  description: string;
  priority: "urgent" | "high" | "medium" | "low";
  dueDate?: string | null; // ISO 8601 YYYY-MM-DD
  startDate?: string | null;
  quarter?: string | null; // e.g. "2026-Q1"
  subtasks: ParsedSubtask[];
  suggestedList?: string | null; // e.g. "To Do", "In Progress", "Backlog"
}

export interface ImproveTaskResult {
  title: string;
  description: string; // HTML formatted for Tiptap
  suggestedSubtasks: { title: string }[];
}

export const PROVIDER_DEFAULT_MODELS: Record<AiProvider, string> = {
  openai: "gpt-4o",
  claude: "claude-sonnet-5-5",
  gemini: "gemini-3.8-flash",
  grok: "grok-2-1212",
  deepseek: "deepseek-chat",
  kimi: "moonshot-v1-8k",
  custom: "default",
};

// Modelos que los proveedores ya retiraron. Muchas cuentas los tienen guardados porque Ajustes
// guardaba el modelo por defecto como si lo hubiera elegido el usuario; se ignoran y manda el de la app.
export const RETIRED_MODELS: ReadonlySet<string> = new Set([
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "claude-3-5-sonnet-20241022",
]);

/** El modelo elegido por el usuario, o undefined si no eligió ninguno o el que guardó ya no existe. */
export function usableModel(model: string | null | undefined): string | undefined {
  const trimmed = model?.trim();
  return trimmed && !RETIRED_MODELS.has(trimmed) ? trimmed : undefined;
}

export const PROVIDER_BASE_URLS: Partial<Record<AiProvider, string>> = {
  openai: "https://api.openai.com",
  claude: "https://api.anthropic.com",
  gemini: "https://generativelanguage.googleapis.com",
  grok: "https://api.x.ai",
  deepseek: "https://api.deepseek.com",
  kimi: "https://api.moonshot.cn",
};
