import {
  AiCredentials,
  ImproveTaskResult,
  ParsedTask,
  PROVIDER_BASE_URLS,
  PROVIDER_DEFAULT_MODELS,
} from "./types";
import { IMPROVE_TASK_PROMPT, PARSE_BRAIN_DUMP_PROMPT } from "./prompts";

/**
 * Clean JSON output from LLM by removing code fences if present.
 */
function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    const lines = cleaned.split("\n");
    if (lines[lines.length - 1].trim() === "```") {
      cleaned = lines.slice(1, -1).join("\n");
    } else {
      cleaned = lines.slice(1).join("\n");
    }
  }
  return cleaned.trim();
}

/**
 * Call Anthropic Claude API
 */
async function callClaude(
  systemPrompt: string,
  userContent: string,
  creds: AiCredentials,
): Promise<string> {
  const baseUrl = creds.baseUrl || PROVIDER_BASE_URLS.claude;
  const model = creds.model || PROVIDER_DEFAULT_MODELS.claude;

  const res = await fetch(`${baseUrl}/v1/messages`, {
    method: "POST",
    headers: {
      "x-api-key": creds.apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error de Claude (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

/**
 * Call Google Gemini API
 */
async function callGemini(
  systemPrompt: string,
  userContent: string,
  creds: AiCredentials,
): Promise<string> {
  const model = creds.model || PROVIDER_DEFAULT_MODELS.gemini;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(creds.apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          parts: [{ text: userContent }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error de Gemini (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini no devolvió ninguna respuesta.");
  }
  return text;
}

/**
 * Call OpenAI-compatible API (OpenAI, xAI Grok, DeepSeek, Kimi/Moonshot, Custom)
 */
async function callOpenAiCompatible(
  systemPrompt: string,
  userContent: string,
  creds: AiCredentials,
): Promise<string> {
  let defaultBase = PROVIDER_BASE_URLS[creds.provider] || "https://api.openai.com";
  let baseUrl = (creds.baseUrl || defaultBase).replace(/\/+$/, "");
  // If baseUrl doesn't end with /v1, append /v1 unless it already has it
  const endpoint = baseUrl.endsWith("/v1")
    ? `${baseUrl}/chat/completions`
    : `${baseUrl}/v1/chat/completions`;

  const model = creds.model || PROVIDER_DEFAULT_MODELS[creds.provider] || "gpt-4o";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `Error de ${creds.provider.toUpperCase()} (${res.status}): ${errText}`,
    );
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("El modelo de IA devolvió una respuesta vacía.");
  }
  return content;
}

/**
 * Dispatch LLM request based on provider
 */
export async function queryLlm(
  systemPrompt: string,
  userContent: string,
  creds: AiCredentials,
): Promise<string> {
  if (!creds.apiKey) {
    throw new Error(
      "No has configurado tu clave API de IA. Ve a Ajustes en tu cuenta para añadirla.",
    );
  }

  switch (creds.provider) {
    case "claude":
      return await callClaude(systemPrompt, userContent, creds);
    case "gemini":
      return await callGemini(systemPrompt, userContent, creds);
    case "openai":
    case "grok":
    case "deepseek":
    case "kimi":
    case "custom":
    default:
      return await callOpenAiCompatible(systemPrompt, userContent, creds);
  }
}

/**
 * Parse a raw brain dump into structured tasks
 */
export async function parseBrainDump(
  rawText: string,
  creds: AiCredentials,
): Promise<ParsedTask[]> {
  const responseText = await queryLlm(
    PARSE_BRAIN_DUMP_PROMPT,
    `Extract structured tasks from the following text:\n\n${rawText}`,
    creds,
  );

  const cleaned = cleanJsonString(responseText);
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err: any) {
    throw new Error(`Formato JSON inválido recibido de la IA: ${err.message}`);
  }

  if (Array.isArray(parsed)) {
    return parsed as ParsedTask[];
  }

  if (parsed && typeof parsed === "object") {
    // Some models wrap array in "tasks" or other key
    if (Array.isArray(parsed.tasks)) return parsed.tasks as ParsedTask[];
    for (const val of Object.values(parsed)) {
      if (Array.isArray(val)) return val as ParsedTask[];
    }
  }

  throw new Error("La respuesta de la IA no contiene una lista válida de tareas.");
}

/**
 * Improve task title, description, and suggest subtasks
 */
export async function improveTask(
  title: string,
  description: string,
  creds: AiCredentials,
): Promise<ImproveTaskResult> {
  const userContent = `Task Title: ${title}\nTask Description: ${
    description || "(empty)"
  }`;

  const responseText = await queryLlm(
    IMPROVE_TASK_PROMPT,
    userContent,
    creds,
  );

  const cleaned = cleanJsonString(responseText);
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err: any) {
    throw new Error(`Formato JSON inválido recibido de la IA: ${err.message}`);
  }

  return {
    title: parsed.title || title,
    description: parsed.description || description,
    suggestedSubtasks: Array.isArray(parsed.suggestedSubtasks)
      ? parsed.suggestedSubtasks
      : Array.isArray(parsed.subtasks)
      ? parsed.subtasks
      : [],
  };
}
