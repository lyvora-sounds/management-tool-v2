import { markdownInformation } from "./markdown";
import { ticketTable } from "./ticketTable";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

// Custom capability: MCP does not imply SVG support from the client name.
export const SVG_CAPABILITY = "xyz.kikiboard/svg";
export const presentationSchema = {
  type: "object", additionalProperties: false,
  description: "Markdown is the default. Request SVG only if this client can render embedded image/svg+xml resources. Enable links only if it supports SVG hyperlinks.",
  properties: {
    format: { type: "string", enum: ["markdown", "text", "svg"], default: "markdown" },
    interactive: { type: "boolean", description: "This client supports links inside SVG." },
  },
};

function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function escapeXml(value: string) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, "\uFFFD").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character]!);
}
function origin() {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "");
    return ["https:", "http:"].includes(url.protocol) ? url.origin : undefined;
  } catch { return undefined; }
}
function navigation(data: unknown): { label: string; href: string }[] {
  const base = origin();
  if (!base) return [];
  const links = new Map<string, string>();
  function visit(value: unknown) {
    if (Array.isArray(value)) { value.forEach(visit); return; }
    const row = object(value);
    const board = object(row.board);
    if (typeof row.id === "string" && typeof row.title === "string" && typeof board.id === "string") {
      links.set(`${base}/board/${encodeURIComponent(board.id)}?taskId=${encodeURIComponent(row.id)}`, row.title);
    }
    if (typeof row.id === "string" && typeof row.title === "string" && Array.isArray(row.list)) {
      links.set(`${base}/board/${encodeURIComponent(row.id)}`, row.title);
    }
    Object.values(row).forEach(child => { if (child && typeof child === "object") visit(child); });
  }
  visit(data);
  return [...links].map(([href, label]) => ({ href, label }));
}

export function informationResponse(tool: string, data: unknown, preference: unknown, capabilities: unknown): CallToolResult {
  const json = JSON.stringify(data, null, 2);
  const fallback = { type: "text" as const, text: json };
  const request = object(preference);
  const capability = object(object(object(capabilities).experimental)[SVG_CAPABILITY]);
  if (request.format === "text") return { content: [fallback] };
  if (request.format !== "svg") return { content: [{ type: "text", text: markdownInformation(tool, data, origin()) }], structuredContent: { data: JSON.parse(json) } };
  const interactive = request.interactive === true || (request.interactive !== false && capability.links === true);
  if (tool === "list_tickets" && Array.isArray(data)) {
    return { content: [{ type: "resource", resource: { uri: "kikiboard://presentation/list_tickets", mimeType: "image/svg+xml", text: ticketTable(data, interactive, origin()) } }, fallback] };
  }
  const links = interactive ? navigation(data) : [];
  // Every value is retained. Fixed-width wrapping avoids clipping long titles,
  // descriptions and IDs; no HTML, scripts, external assets or event handlers.
  const lines = json.split("\n").flatMap(line => {
    const characters = Array.from(line);
    return characters.length ? Array.from({ length: Math.ceil(characters.length / 72) }, (_, index) => characters.slice(index * 72, (index + 1) * 72).join("")) : [""];
  });
  const linkRows = links.flatMap(link => {
    const characters = Array.from(link.label);
    return Array.from({ length: Math.max(1, Math.ceil(characters.length / 72)) }, (_, index) => ({ ...link, label: characters.slice(index * 72, (index + 1) * 72).join("") }));
  });
  const height = 108 + linkRows.length * 28 + lines.length * 20;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="${height}" viewBox="0 0 1000 ${height}" role="img" aria-labelledby="title description"><title id="title">${escapeXml(tool.replaceAll("_", " "))}</title><desc id="description">Complete Kikiboard response.${links.length ? " Use the links to open tickets or boards; sign-in may be required." : ""}</desc><rect width="1000" height="${height}" fill="#f8fafc"/><g font-family="monospace" font-size="12" fill="#0f172a"><text x="24" y="36" font-size="22">${escapeXml(tool.replaceAll("_", " "))}</text>${linkRows.map((link, index) => `<a href="${escapeXml(link.href)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeXml(link.label)}"><text x="24" y="${72 + index * 28}" fill="#1d4ed8" text-decoration="underline">${escapeXml(link.label)}</text></a>`).join("")}${lines.map((line, index) => `<text x="24" y="${88 + linkRows.length * 28 + index * 20}" xml:space="preserve">${escapeXml(line)}</text>`).join("")}</g></svg>`;
  return { content: [{ type: "resource", resource: { uri: `kikiboard://presentation/${tool}`, mimeType: "image/svg+xml", text: svg } }, fallback] };
}
