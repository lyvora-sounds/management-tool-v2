// Script-free SVG table. Links are the only interactive behavior.
type Row = Record<string, unknown>;
const record = (value: unknown): Row => value && typeof value === "object" ? value as Row : {};
const label = (value: unknown, fallback = "—") => typeof value === "string" && value ? value : fallback;
const xml = (value: string) => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, "\uFFFD").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character]!);
function wrap(value: string, width: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of value.replace(/\s+/g, " ").split(" ")) {
    if (line && Array.from(`${line} ${word}`).length > width) { lines.push(line); line = ""; }
    const characters = Array.from(word);
    while (characters.length > width) { if (line) { lines.push(line); line = ""; } lines.push(characters.splice(0, width).join("")); }
    if (characters.length) line += `${line ? " " : ""}${characters.join("")}`;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}
const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
const text = (x: number, y: number, value: string, attributes = "") => `<text x="${x}" y="${y}" ${attributes}>${xml(value)}</text>`;
function date(value: unknown) {
  if (!value) return "—";
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString().slice(0, 10);
}

export function ticketTable(data: unknown[], interactive: boolean, origin?: string) {
  const rows = data.map(record);
  const pending = rows.filter(row => row.completed !== true).length;
  const groups = new Map<string, { board: string; list: string; done: boolean; rows: Row[] }>();
  for (const row of rows) {
    const board = record(row.board), list = record(row.list), done = row.completed === true;
    const key = JSON.stringify([board.id ?? board.title, done, list.id ?? list.title]);
    if (!groups.has(key)) groups.set(key, { board: label(board.title, "Board"), list: label(list.title, "No list"), done, rows: [] });
    groups.get(key)!.rows.push(row);
  }
  const sections = [...groups.values()].sort((a, b) => a.board.localeCompare(b.board) || Number(a.done) - Number(b.done) || a.list.localeCompare(b.list));
  let y = 178;
  const body: string[] = [];
  for (const group of sections) {
    for (const line of wrap(`${group.board} / ${group.list} · ${group.done ? "Done" : "Pending"} · ${group.rows.length}`, 110)) {
      body.push(`<rect x="24" y="${y}" width="1392" height="38" fill="#eef2f6"/>`, text(40, y + 25, line, `font-weight="600"`));
      y += 38;
    }
    group.rows.sort((a, b) => (priorityOrder[String(a.priority)] ?? 4) - (priorityOrder[String(b.priority)] ?? 4) || label(a.title).localeCompare(label(b.title)));
    for (const row of group.rows) {
      const cells = [wrap(label(row.title, "Untitled ticket"), 48), wrap(label(record(row.assignee).name, "Unassigned"), 17), wrap(label(record(row.qa).name), 16), wrap(date(row.dueDate), 12)];
      const height = Math.max(68, 28 + Math.max(...cells.map(cell => cell.length)) * 19);
      const center = y + height / 2;
      body.push(`<rect x="24" y="${y}" width="1392" height="${height}" fill="#fff"/><path d="M24 ${y + height}H1416" stroke="#e2e8f0"/>`);
      const title = cells[0].map((line, index) => text(42, y + 29 + index * 19, line, 'font-weight="500"')).join("");
      const boardId = record(row.board).id;
      const href = interactive && origin && typeof row.id === "string" && typeof boardId === "string" ? `${origin}/board/${encodeURIComponent(boardId)}?taskId=${encodeURIComponent(row.id)}` : undefined;
      body.push(href ? `<a href="${xml(href)}" target="_blank" rel="noopener noreferrer" aria-label="${xml(`Open ticket: ${label(row.title)}`)}" fill="#1d4ed8">${title}<title>${xml(label(row.title))}</title></a>` : title);
      const done = row.completed === true;
      body.push(`<rect x="648" y="${center - 15}" width="88" height="28" rx="14" fill="${done ? "#dcfce7" : "#e0e7ff"}"/>`, text(662, center + 4, done ? "Done" : "Pending", `fill="${done ? "#166534" : "#3730a3"}" font-size="13" font-weight="600"`));
      const priority = label(row.priority);
      const color = ({ urgent: "#b91c1c", high: "#c2410c", medium: "#854d0e", low: "#0369a1" } as Record<string, string>)[priority] ?? "#64748b";
      body.push(text(772, center + 4, priority === "—" ? priority : priority[0].toUpperCase() + priority.slice(1), `fill="${color}" font-weight="600"`));
      [920, 1120, 1300].forEach((x, index) => cells[index + 1].forEach((line, lineIndex) => body.push(text(x, y + 29 + lineIndex * 19, line, 'fill="#475569" font-size="13"'))));
      y += height;
    }
    y += 16;
  }
  if (!rows.length) { body.push(text(42, y + 48, "No tickets match this request.", 'fill="#64748b"')); y += 100; }
  const footer = "Showing tickets returned by this request. For more results, request the next page with cursor.";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="${y + 64}" viewBox="0 0 1440 ${y + 64}" role="img" aria-labelledby="table-title table-description"><title id="table-title">Tickets classified by board, list and completion</title><desc id="table-description">${rows.length} tickets: ${pending} pending and ${rows.length - pending} done. Columns: ticket, status, priority, assignee, QA and due date. ${interactive ? "Ticket titles open the authenticated board." : "Static table."} Full data is available in the accompanying text response.</desc><rect width="1440" height="${y + 64}" fill="#f8fafc"/><g font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#0f172a">${text(32, 48, "Tickets", 'font-size="28" font-weight="700"')}${text(32, 80, `${rows.length} total · ${pending} pending · ${rows.length - pending} done`, 'fill="#64748b"')}${text(32, 112, "Grouped by board, list and completion", 'fill="#64748b" font-size="12"')}<rect x="24" y="136" width="1392" height="42" rx="8" fill="#0f172a"/>${[[42, "TICKET"], [662, "STATUS"], [772, "PRIORITY"], [920, "ASSIGNEE"], [1120, "QA"], [1300, "DUE DATE"]].map(([x, title]) => text(Number(x), 162, String(title), 'fill="#fff" font-size="11" font-weight="600" letter-spacing="1"')).join("")}${body.join("")}${text(32, y + 32, footer, 'fill="#64748b" font-size="11"')}</g></svg>`;
}
