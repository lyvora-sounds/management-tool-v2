import { describe, expect, it } from "vitest";
import {
  formatTicketDescriptionHtml,
  looksLikeHtmlDescription,
  normalizeAiTicketDescription,
  sanitizeTicketHtml,
} from "@/lib/ticketDescriptionHtml";

describe("formatTicketDescriptionHtml", () => {
  it("returns empty string for blank input", () => {
    expect(formatTicketDescriptionHtml("")).toBe("");
    expect(formatTicketDescriptionHtml("   \n\t  ")).toBe("");
  });

  it("preserves existing semantic HTML descriptions", () => {
    const html =
      "<h3>Summary</h3><p>Use <strong>InfoBubble</strong> in <code>Settings</code>.</p><ul><li>One</li><li>Two</li></ul>";
    expect(looksLikeHtmlDescription(html)).toBe(true);
    expect(formatTicketDescriptionHtml(html)).toBe(html);
  });

  it("sanitizes dangerous tags and attributes when input is HTML", () => {
    const dirty =
      '<p onclick="alert(1)">Hello</p><script>alert(1)</script><a href="javascript:alert(1)">Link</a>';
    const clean = sanitizeTicketHtml(dirty);
    expect(clean).not.toContain("<script");
    expect(clean).not.toContain("onclick");
    expect(clean).not.toContain("javascript:");
    expect(clean).toContain("<p>Hello</p>");
  });

  it("converts raw Markdown headings, lists, bold, italic, code, quotes, and links into clean HTML", () => {
    const markdown = [
      "### Summary",
      "",
      "Move **helper copy** into `InfoBubble` in *Settings*.",
      "",
      "- [ ] Update `TwoFactorSettings.tsx`",
      "- [x] Verify `AppearanceSettings.tsx` with snake_case_var",
      "",
      "1. First step",
      "2. Second step",
      "",
      "> Keep UI calm and scannable.",
      "",
      "---",
      "",
      "```ts",
      "const ok = a < b && c > d;",
      "```",
      "",
      "See [Docs](https://kikiboard.xyz/docs_v1) and <InfoBubble>.",
    ].join("\n");

    const html = formatTicketDescriptionHtml(markdown);
    expect(html).toContain("<h3>Summary</h3>");
    expect(html).toContain(
      "<p>Move <strong>helper copy</strong> into <code>InfoBubble</code> in <em>Settings</em>.</p>",
    );
    expect(html).toContain(
      "<ul><li>☐ Update <code>TwoFactorSettings.tsx</code></li><li>☑ Verify <code>AppearanceSettings.tsx</code> with snake_case_var</li></ul>",
    );
    expect(html).toContain("<ol><li>First step</li><li>Second step</li></ol>");
    expect(html).toContain("<blockquote><p>Keep UI calm and scannable.</p></blockquote>");
    expect(html).toContain("<hr />");
    expect(html).toContain("<pre><code>const ok = a &lt; b &amp;&amp; c &gt; d;</code></pre>");
    expect(html).toContain(
      '<a href="https://kikiboard.xyz/docs_v1" target="_blank" rel="noopener noreferrer">Docs</a>',
    );
    expect(html).toContain("&lt;InfoBubble&gt;");
    expect(html).not.toContain("<em>v1</em>");
  });

  it("preserves single-line breaks inside plain paragraphs instead of collapsing them", () => {
    const text = "Board: KQ\nList: To do";
    expect(formatTicketDescriptionHtml(text)).toBe("<p>Board: KQ<br />List: To do</p>");
  });

  it("rejects javascript: links in Markdown", () => {
    expect(formatTicketDescriptionHtml("[Click](javascript:alert(1))")).toBe(
      "<p>[Click](javascript:alert(1))</p>",
    );
  });

  it("blocks slash-separated, unquoted, entity-encoded, and unclosed XSS payloads", () => {
    const payloads = [
      '<p/onclick=alert(1)>Hello</p><svg/onload=alert(1)>',
      '<p>Safe</p><img/src=x/onerror=alert(1)>',
      '<p>Text</p><script >alert(1)</script ><script>alert(2)',
      '<p><a href=javascript:alert(1)>A</a> <a href="jav&#x09;ascript:alert(2)">B</a> <a href="data:image/svg+xml,<svg>">C</a></p>',
    ];
    for (const payload of payloads) {
      const clean = formatTicketDescriptionHtml(payload);
      expect(clean).not.toMatch(/on(?:click|load|error)/i);
      expect(clean).not.toMatch(/<script|<svg|<img/i);
      expect(clean).not.toMatch(/javascript:|data:image\/svg\+xml/i);
    }
    expect(formatTicketDescriptionHtml('<p/onclick=alert(1)>Hello</p><svg/onload=alert(1)>')).toBe(
      "<p>Hello</p>",
    );
  });

  it("supports nested Markdown lists, tables, nested bold+italic, and parenthesized URLs", () => {
    const markdown = [
      "- Parent with **bold and *italic* inside**",
      "  - Child item",
      "    - Grandchild item",
      "  1. Ordered child",
      "",
      "| Screen | Target |",
      "| --- | --- |",
      "| Settings | `InfoBubble` |",
      "",
      "See [Wiki](https://en.wikipedia.org/wiki/Popover_(GUI))",
    ].join("\n");

    const html = formatTicketDescriptionHtml(markdown);
    expect(html).toContain(
      "<ul><li>Parent with <strong>bold and <em>italic</em> inside</strong><ul><li>Child item<ul><li>Grandchild item</li></ul></li></ul><ol><li>Ordered child</li></ol></li></ul>",
    );
    expect(html).toContain(
      "<table><thead><tr><th>Screen</th><th>Target</th></tr></thead><tbody><tr><td>Settings</td><td><code>InfoBubble</code></td></tr></tbody></table>",
    );
    expect(html).toContain(
      '<a href="https://en.wikipedia.org/wiki/Popover_(GUI)" target="_blank" rel="noopener noreferrer">Wiki</a>',
    );
  });

  it("preserves paired inline HTML and normalizes AI Markdown outputs without breaking plain strings", () => {
    expect(formatTicketDescriptionHtml("<strong>Note:</strong> Ready")).toBe(
      "<strong>Note:</strong> Ready",
    );
    expect(normalizeAiTicketDescription("plain text")).toBe("plain text");
    expect(normalizeAiTicketDescription("### Summary\n\n- **One**")).toBe(
      "<h3>Summary</h3><ul><li><strong>One</strong></li></ul>",
    );
  });
});
