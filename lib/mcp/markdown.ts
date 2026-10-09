type Row = Record<string, unknown>;
const record = (value: unknown): Row => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Row : {};
// Escape untrusted table content and link labels; never emit user-supplied HTML.
export function markdownText(value: unknown, fallback = "—"): string {
  const text = value === null || value === undefined || value === "" ? fallback : String(value);
  return text.replace(/[&<>\\|`*_{}\[\]()#!~]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\\": "&#92;", "|": "&#124;" } as Record<string, string>)[character] ?? `\\${character}`).replace(/[\r\n]+/g, " ");
}
function date(value: unknown) {
  if (!value) return "—";
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? markdownText(value) : parsed.toISOString().slice(0, 10);
}
function status(row: Row) {
  if (row.completed === true) return "🟢 **Done**";
  const list = String(record(row.list).title ?? "").toLowerCase();
  if (/in progress|in-progress/.test(list)) return "🔵 **In progress**";
  if (/review/.test(list)) return "🟣 **In review**";
  if (/draft|backlog/.test(list)) return "⚪ **Draft**";
  return "🟡 **Pending**";
}
function priority(value: unknown) {
  return ({ urgent: "🔴 **Urgent**", high: "🟠 **High**", medium: "🟡 Medium", low: "🔵 Low" } as Record<string, string>)[String(value)] ?? "⚪ Not set";
}
function ticketTitle(row: Row, origin?: string) {
  const title = markdownText(row.title, "Untitled ticket"), boardId = record(row.board).id;
  return origin && typeof row.id === "string" && typeof boardId === "string" ? `[${title}](${origin}/board/${encodeURIComponent(boardId)}?taskId=${encodeURIComponent(row.id)})` : title;
}
function details(value: unknown, depth = 0): string[] {
  const indent = "  ".repeat(depth);
  if (Array.isArray(value)) return value.length ? value.flatMap((item, index) => [`${indent}- **${index + 1}**`, ...details(item, depth + 1)]) : [`${indent}- None`];
  if (value !== null && typeof value === "object") return Object.entries(record(value)).flatMap(([key, child]) => child !== null && typeof child === "object" ? [`${indent}- **${markdownText(key)}**`, ...details(child, depth + 1)] : [`${indent}- **${markdownText(key)}:** ${markdownText(child)}`]);
  return [`${indent}- ${markdownText(value)}`];
}

export function markdownInformation(tool: string, data: unknown, origin?: string) {
  let body: string;
  if (tool === "list_tickets" && Array.isArray(data)) {
    const rows = data.map(record), done = rows.filter(row => row.completed === true).length;
    const groups = new Map<string, { board: string; rows: Row[] }>();
    for (const row of rows) {
      const board = record(row.board), key = String(board.id ?? board.title ?? "Board");
      if (!groups.has(key)) groups.set(key, { board: markdownText(board.title, "Board"), rows: [] });
      groups.get(key)!.rows.push(row);
    }
    const rank: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    const tables = [...groups.values()].map(group => {
      group.rows.sort((a, b) => Number(a.completed === true) - Number(b.completed === true) || (rank[String(a.priority)] ?? 4) - (rank[String(b.priority)] ?? 4) || String(record(a.list).title ?? "").localeCompare(String(record(b.list).title ?? "")) || String(a.title ?? "").localeCompare(String(b.title ?? "")));
      return `### 📋 ${group.board}\n\n| Ticket | Status | Priority | List | Assignee | QA | Due date |\n| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n` + group.rows.map(row => `| ${ticketTitle(row, origin)} | ${status(row)} | ${priority(row.priority)} | ${markdownText(record(row.list).title)} | ${markdownText(record(row.assignee).name, "👤 Unassigned")} | ${markdownText(record(row.qa).name)} | ${date(row.dueDate)} |`).join("\n");
    });
    body = `## 🎟️ Tickets\n\n**${rows.length} total** · 🟡 **${rows.length - done} pending** · 🟢 **${done} done**\n\n${tables.join("\n\n") || "No tickets match this request."}\n\n_Status includes the current workflow list; completed tickets always show Done. Showing this response only; use cursor for further pages._`;
  } else if (tool === "get_ticket") {
    const row = record(data);
    body = `## 🎟️ ${ticketTitle(row, origin)}\n\n${status(row)} · ${priority(row.priority)}\n\n**Board:** ${markdownText(record(row.board).title)} · **List:** ${markdownText(record(row.list).title)}\n\n**👤 Assignee:** ${markdownText(record(row.assignee).name, "Unassigned")} · **📅 Due:** ${date(row.dueDate)}\n\n### Ticket details\n\n${details(data).join("\n")}`;
  } else {
    body = `## ${tool === "get_project" ? "🏢 Project" : "🕘 Change history"}\n\n${details(data).join("\n")}`;
  }
  return `${body}\n\n_🎨 Prefer a visual table? Request \`presentation.format: "svg"\` in a compatible client._`;
}
