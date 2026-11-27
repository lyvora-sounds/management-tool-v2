export const TICKET_DESCRIPTION_HTML_INSTRUCTION = [
  "When creating or updating a ticket with create_ticket or update_tickets, format description as clean, scannable, human-readable HTML — NEVER raw Markdown (no ###, **, ``` or - bullets, which collapse into an unformatted paragraph in the ticket modal).",
  "Use semantic HTML tags supported by Kikiboard's editor: <h3> (or <h2>) for section headings, <p> for concise paragraphs, <ul>/<ol> and <li> for lists, <strong> for emphasis, <code> for inline identifiers or paths, <pre><code> for code blocks, and <blockquote> for callouts.",
  "Structure non-trivial ticket descriptions into clear sections (such as <h3>Summary</h3>, <h3>Context</h3>, and <h3>Acceptance Criteria</h3>) so every ticket is immediately readable and appealing to a human reader.",
].join(" ");

export const TICKET_DESCRIPTION_HTML_SCHEMA_DOC =
  "Human-readable HTML ticket description (e.g. <h3>Summary</h3><p>...</p><h3>Acceptance Criteria</h3><ul><li>...</li></ul>). Use semantic HTML tags (<p>, <h2>, <h3>, <ul>, <ol>, <li>, <strong>, <em>, <code>, <pre><code>, <blockquote>, <hr>); do NOT pass raw Markdown.";

const BLOCK_HTML_START = /^\s*<(?:p|h[1-6]|ul|ol|blockquote|pre|div|table|section|article)\b[^>]*>/i;
const BLOCK_HTML_END = /<\/(?:p|h[1-6]|ul|ol|li|blockquote|pre|div|table|section|article)>|<hr\s*\/?>/i;
const PAIRED_INLINE_HTML = /<(strong|b|em|i|code|a|s|del|u)\b[^>]*>[\s\S]*?<\/\1\s*>/i;
const MARKDOWN_BLOCK_LINE = /^\s*(?:```|~~~|#{1,6}\s+|>\s?|[-*+]\s+|\d+[.)]\s+|(?:-{3,}|\*{3,}|_{3,})\s*$)/m;
const MARKDOWN_INDICATOR = /(?:^|\n)\s*(?:```|~~~|#{1,6}\s+|>\s?|[-*+]\s+|\d+[.)]\s+|(?:-{3,}|\*{3,}|_{3,})\s*$)|\*\*[^*\n]+\*\*|__[^_\n]+__|~~[^~\n]+~~|`[^`\n]+`|\[[^\]]+\]\([^)\s]+\)|\n/;

const CONTAINER_BLOCK_TAGS = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "svg",
  "math",
  "noscript",
  "template",
  "form",
]);

const ALLOWED_HTML_TAGS = new Set([
  "p",
  "br",
  "hr",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "strong",
  "b",
  "em",
  "i",
  "s",
  "del",
  "u",
  "code",
  "pre",
  "blockquote",
  "a",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "span",
  "div",
]);

const VOID_HTML_TAGS = new Set(["br", "hr"]);

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  colon: ":",
  tab: "\t",
  newline: "\n",
};

function decodeHtmlEntities(value: string): string {
  return value.replace(/&(?:#x([0-9a-f]+)|#([0-9]+)|([a-z]+));/gi, (full, hex, dec, named) => {
    if (hex) {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
    }
    if (dec) {
      const code = Number.parseInt(dec, 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
    }
    if (named) {
      return NAMED_ENTITIES[named.toLowerCase()] ?? full;
    }
    return full;
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripControlAndWhitespace(value: string): string {
  let out = "";
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code > 0x20 && code !== 0x7f) {
      out += value[i]!;
    }
  }
  return out;
}

function isSafeLinkUrl(url: string): boolean {
  const decoded = stripControlAndWhitespace(decodeHtmlEntities(url)).trim();
  if (!decoded) return false;
  if (decoded.startsWith("#")) return true;
  if (decoded.startsWith("/") && !decoded.startsWith("//")) return true;
  const lower = decoded.toLowerCase();
  return (
    lower.startsWith("https://") ||
    lower.startsWith("http://") ||
    lower.startsWith("mailto:")
  );
}

function parseAttributes(rawAttrs: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const cleaned = rawAttrs.replace(/^\/+|\/+$/g, " ");
  const attrRegex = /([a-zA-Z_:][a-zA-Z0-9_.:-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of cleaned.matchAll(attrRegex)) {
    const name = match[1]?.toLowerCase();
    if (!name) continue;
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    if (!(name in attrs)) {
      attrs[name] = value;
    }
  }
  return attrs;
}

export function looksLikeHtmlDescription(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (BLOCK_HTML_END.test(trimmed) || BLOCK_HTML_START.test(trimmed)) return true;
  return PAIRED_INLINE_HTML.test(trimmed) && !MARKDOWN_BLOCK_LINE.test(trimmed);
}

export function sanitizeTicketHtml(html: string): string {
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
  let result = "";
  let lastIndex = 0;

  while (true) {
    tagRegex.lastIndex = lastIndex;
    const match = tagRegex.exec(html);
    if (!match) {
      result += html.slice(lastIndex).replace(/<(?:script|style|iframe|object|embed|svg|math|noscript|template|form)\b[\s\S]*$/i, "");
      break;
    }

    result += html.slice(lastIndex, match.index);
    const full = match[0];
    const isClosing = full.startsWith("</");
    const tag = match[1]!.toLowerCase();
    const rawAttrs = match[2] ?? "";
    lastIndex = tagRegex.lastIndex;

    if (CONTAINER_BLOCK_TAGS.has(tag)) {
      if (!isClosing && !rawAttrs.trimEnd().endsWith("/")) {
        const closeRe = new RegExp(`</${tag}\\s*>`, "gi");
        closeRe.lastIndex = lastIndex;
        const closeMatch = closeRe.exec(html);
        if (closeMatch) {
          lastIndex = closeRe.lastIndex;
        } else {
          lastIndex = html.length;
          break;
        }
      }
      continue;
    }

    if (!ALLOWED_HTML_TAGS.has(tag)) continue;
    if (isClosing) {
      result += VOID_HTML_TAGS.has(tag) ? "" : `</${tag}>`;
      continue;
    }
    if (VOID_HTML_TAGS.has(tag)) {
      result += `<${tag} />`;
      continue;
    }

    const attrs = parseAttributes(rawAttrs);
    if (tag === "a") {
      if (!("href" in attrs)) {
        result += "<a>";
        continue;
      }
      const rawHref = attrs.href ?? "";
      const decodedHref = decodeHtmlEntities(rawHref).trim();
      const safeHref = isSafeLinkUrl(rawHref) ? decodedHref : "#";
      const parts = [`href="${escapeHtml(safeHref)}"`];
      if (safeHref !== "#" && !safeHref.startsWith("#")) {
        parts.push('target="_blank"', 'rel="noopener noreferrer"');
      }
      result += `<a ${parts.join(" ")}>`;
      continue;
    }

    if (tag === "code" || tag === "pre") {
      const safeClasses = (attrs.class ?? "")
        .split(/\s+/)
        .filter((token) => /^language-[a-z0-9_-]+$/i.test(token));
      result += safeClasses.length ? `<${tag} class="${escapeHtml(safeClasses.join(" "))}">` : `<${tag}>`;
      continue;
    }

    if (tag === "th" || tag === "td") {
      const parts: string[] = [];
      for (const spanAttr of ["colspan", "rowspan"] as const) {
        const val = attrs[spanAttr];
        if (val && /^[1-9]\d{0,1}$/.test(val)) {
          parts.push(`${spanAttr}="${val}"`);
        }
      }
      result += parts.length ? `<${tag} ${parts.join(" ")}>` : `<${tag}>`;
      continue;
    }

    result += `<${tag}>`;
  }

  return result;
}

function formatEscapedEmphasis(escaped: string): string {
  let text = escaped;
  text = text.replace(/\*\*((?:[^*\n]|\*(?!\*))+?)\*\*/g, (_m, inner: string) => {
    return `<strong>${formatEscapedEmphasis(inner)}</strong>`;
  });
  text = text.replace(/__((?:[^_\n]|_(?!_))+?)__/g, (_m, inner: string) => {
    return `<strong>${formatEscapedEmphasis(inner)}</strong>`;
  });
  text = text.replace(/~~([^~\n]+?)~~/g, "<s>$1</s>");
  text = text.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, "<em>$1</em>");
  text = text.replace(/(^|[\s(>])_([^_\n]+?)_(?=[\s).,!?:;<]|$)/g, "$1<em>$2</em>");
  return text;
}

function formatInlineMarkdown(raw: string): string {
  const tokens: string[] = [];
  const hold = (html: string) => {
    const id = `\uE000${tokens.length}\uE001`;
    tokens.push(html);
    return id;
  };

  // Preserve inline code first so markdown syntax inside backticks is untouched.
  let text = raw.replace(/`([^`\n]+)`/g, (_match, code: string) =>
    hold(`<code>${escapeHtml(code)}</code>`),
  );

  // Extract safe markdown links before escaping/emphasis so underscores in URLs are untouched.
  text = text.replace(
    /\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g,
    (match, label: string, url: string) => {
      if (!isSafeLinkUrl(url)) return match;
      return hold(
        `<a href="${escapeHtml(url.trim())}" target="_blank" rel="noopener noreferrer">${formatInlineMarkdown(label)}</a>`,
      );
    },
  );

  text = formatEscapedEmphasis(escapeHtml(text));

  return text.replace(/\uE000(\d+)\uE001/g, (_match, index: string) => tokens[Number(index)] ?? "");
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  const cells: string[] = [];
  let current = "";
  let inCode = false;
  for (let idx = 0; idx < trimmed.length; idx++) {
    const ch = trimmed[idx]!;
    if (ch === "\\" && trimmed[idx + 1] === "|") {
      current += "|";
      idx++;
      continue;
    }
    if (ch === "`") {
      inCode = !inCode;
      current += ch;
      continue;
    }
    if (ch === "|" && !inCode) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function isTableSeparator(line: string): boolean {
  if (!line.includes("|")) return false;
  const cells = splitTableRow(line);
  return cells.length >= 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function isFenceLine(line: string): { marker: "`" | "~"; length: number } | null {
  const match = line.match(/^\s*(```+|~~~+)/);
  if (!match) return null;
  const seq = match[1]!;
  return { marker: seq[0] as "`" | "~", length: seq.length };
}

function isListLine(line: string): { indent: number; tag: "ul" | "ol"; content: string } | null {
  const ulMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
  if (ulMatch) {
    let content = ulMatch[2]!.trim();
    content = content.replace(/^\[ \]\s+/, "☐ ").replace(/^\[[xX]\]\s+/, "☑ ");
    return {
      indent: ulMatch[1]!.replace(/\t/g, "  ").length,
      tag: "ul",
      content,
    };
  }
  const olMatch = line.match(/^(\s*)\d+[.)]\s+(.*)$/);
  if (olMatch) {
    return {
      indent: olMatch[1]!.replace(/\t/g, "  ").length,
      tag: "ol",
      content: olMatch[2]!.trim(),
    };
  }
  return null;
}

function isBlockStarter(line: string, nextLine?: string): boolean {
  return (
    isFenceLine(line) !== null ||
    /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line) ||
    /^\s*#{1,6}\s+/.test(line) ||
    /^\s*>\s?/.test(line) ||
    isListLine(line) !== null ||
    (line.includes("|") && nextLine !== undefined && isTableSeparator(nextLine))
  );
}

export function formatTicketDescriptionHtml(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (looksLikeHtmlDescription(trimmed)) {
    return sanitizeTicketHtml(trimmed);
  }

  const lines = trimmed.replace(/\r\n?/g, "\n").split("\n");
  const blocks: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    if (!line.trim()) {
      i++;
      continue;
    }

    const fence = isFenceLine(line);
    if (fence) {
      const codeLines: string[] = [];
      i++;
      const closeRe = new RegExp(`^\\s*${fence.marker}{${fence.length},}\\s*$`);
      while (i < lines.length && !closeRe.test(lines[i]!)) {
        codeLines.push(lines[i]!);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
      continue;
    }

    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      blocks.push("<hr />");
      i++;
      continue;
    }

    const headingMatch = line.match(/^\s*(#{1,6})\s+(.+?)\s*#*$/);
    if (headingMatch) {
      const level = headingMatch[1]!.length <= 2 ? 2 : 3;
      blocks.push(`<h${level}>${formatInlineMarkdown(headingMatch[2]!)}</h${level}>`);
      i++;
      continue;
    }

    if (line.includes("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1]!)) {
      const headers = splitTableRow(line);
      i += 2;
      const bodyRows: string[][] = [];
      while (i < lines.length && lines[i]!.trim() && lines[i]!.includes("|") && !isFenceLine(lines[i]!)) {
        bodyRows.push(splitTableRow(lines[i]!));
        i++;
      }
      const thead = `<thead><tr>${headers.map((h) => `<th>${formatInlineMarkdown(h)}</th>`).join("")}</tr></thead>`;
      const tbody = bodyRows.length
        ? `<tbody>${bodyRows
            .map((row) => `<tr>${headers.map((_, idx) => `<td>${formatInlineMarkdown(row[idx] ?? "")}</td>`).join("")}</tr>`)
            .join("")}</tbody>`
        : "";
      blocks.push(`<table>${thead}${tbody}</table>`);
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i]!)) {
        quoteLines.push(lines[i]!.replace(/^\s*>\s?/, ""));
        i++;
      }
      const quoteBody = quoteLines
        .filter((item) => item.trim())
        .map((item) => formatInlineMarkdown(item.trim()))
        .join("<br />");
      if (quoteBody) blocks.push(`<blockquote><p>${quoteBody}</p></blockquote>`);
      continue;
    }

    const firstList = isListLine(line);
    if (firstList) {
      type ListFrame = { indent: number; tag: "ul" | "ol"; items: string[] };
      const stack: ListFrame[] = [{ indent: firstList.indent, tag: firstList.tag, items: [] }];

      const closeTop = () => {
        const frame = stack.pop()!;
        const html = `<${frame.tag}>${frame.items.join("")}</${frame.tag}>`;
        const parent = stack[stack.length - 1];
        if (parent && parent.items.length > 0) {
          const lastIdx = parent.items.length - 1;
          parent.items[lastIdx] = parent.items[lastIdx]!.replace(/<\/li>$/, `${html}</li>`);
        } else {
          blocks.push(html);
        }
      };

      while (i < lines.length) {
        const parsed = isListLine(lines[i]!);
        if (!parsed) break;

        if (parsed.indent > stack[stack.length - 1]!.indent) {
          stack.push({ indent: parsed.indent, tag: parsed.tag, items: [] });
        } else {
          while (stack.length > 1 && parsed.indent < stack[stack.length - 1]!.indent) {
            closeTop();
          }
          if (parsed.tag !== stack[stack.length - 1]!.tag && parsed.indent === stack[stack.length - 1]!.indent) {
            closeTop();
            stack.push({ indent: parsed.indent, tag: parsed.tag, items: [] });
          }
        }

        stack[stack.length - 1]!.items.push(`<li>${formatInlineMarkdown(parsed.content)}</li>`);
        i++;
      }

      while (stack.length > 0) {
        closeTop();
      }
      continue;
    }

    const paragraphLines: string[] = [];
    while (i < lines.length && lines[i]!.trim() && !isBlockStarter(lines[i]!, lines[i + 1])) {
      paragraphLines.push(lines[i]!.trim());
      i++;
    }
    if (paragraphLines.length) {
      blocks.push(`<p>${paragraphLines.map(formatInlineMarkdown).join("<br />")}</p>`);
    }
  }

  return blocks.join("");
}

/**
 * Normalizes AI-generated or batch-created ticket descriptions into clean HTML
 * when they contain HTML, Markdown, or multi-line formatting, while leaving
 * simple single-line plain strings unchanged.
 */
export function normalizeAiTicketDescription(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (looksLikeHtmlDescription(trimmed)) {
    return sanitizeTicketHtml(trimmed);
  }
  if (MARKDOWN_INDICATOR.test(trimmed) || /[<>]/.test(trimmed)) {
    return formatTicketDescriptionHtml(trimmed);
  }
  return trimmed;
}
