import { afterEach, describe, expect, it, vi } from "vitest";
import { informationResponse, SVG_CAPABILITY } from "@/lib/mcp/presentation";

const ticket = { id: "task&1", title: '<script>alert("x")</script>', board: { id: "board/1" }, description: "x".repeat(300), comments: [{ content: "Complete details" }] };
function svg(result: ReturnType<typeof informationResponse>) {
  const block = result.content[0];
  if (block.type !== "resource" || !("text" in block.resource)) throw new Error("Expected SVG resource");
  expect(block.resource.mimeType).toBe("image/svg+xml");
  return block.resource.text;
}
afterEach(() => vi.unstubAllEnvs());
describe("MCP information presentation", () => {
  it("preserves explicit raw text responses", () => {
    for (const [preference, capabilities] of [[{ format: "text" }, undefined], [{ format: "text" }, { experimental: { [SVG_CAPABILITY]: { supported: true } } }]]) {
      expect(informationResponse("get_ticket", ticket, preference, capabilities).content).toEqual([{ type: "text", text: JSON.stringify(ticket, null, 2) }]);
    }
  });
  it("negotiates SVG and keeps every value in the text fallback", () => {
    const result = informationResponse("get_ticket", ticket, { format: "svg" }, { experimental: { [SVG_CAPABILITY]: { supported: true } } });
    const content = svg(result);
    expect(content).toContain("&lt;script&gt;");
    expect(content).not.toContain("<script>");
    expect(content).toContain("Complete details");
    expect(result.content[1]).toEqual({ type: "text", text: JSON.stringify(ticket, null, 2) });
    expect(content).not.toContain("<a ");
  });
  it("supports explicit per-call SVG preference for stateless clients", () => {
    expect(svg(informationResponse("list_tickets", [], { format: "svg" }, undefined))).toContain("No tickets match this request.");
  });
  it("uses only configured canonical links and encodes untrusted IDs", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://kikiboard.example");
    const content = svg(informationResponse("get_ticket", ticket, { format: "svg", interactive: true }, undefined));
    expect(content).toContain('href="https://kikiboard.example/board/board%2F1?taskId=task%261"');
    expect(content).not.toContain("onclick");
    expect(content).not.toContain("<foreignObject");
  });
  it("honors a link opt-out and suppresses links for invalid origins", () => {
    const capabilities = { experimental: { [SVG_CAPABILITY]: { supported: true, links: true } } };
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://kikiboard.example");
    expect(svg(informationResponse("get_ticket", ticket, { format: "svg", interactive: false }, capabilities))).not.toContain("<a ");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "javascript:alert(1)");
    expect(svg(informationResponse("get_ticket", ticket, { format: "svg" }, capabilities))).not.toContain("<a ");
  });
});

 it("renders classified ticket rows without raw JSON and retains complete fallback data", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://kikiboard.example");
    const rows = [{ ...ticket, completed: true, priority: "high", list: { id: "draft", title: "Draft" }, assignee: { name: "Daniel Alvarez" } }, { ...ticket, id: "second", title: "Another ticket", completed: false, list: { id: "draft", title: "Draft" } }];
    const result = informationResponse("list_tickets", rows, { format: "svg", interactive: true }, undefined);
    const content = svg(result);
    expect(content).toContain("2 total · 1 pending · 1 done");
    expect(content).toContain("Draft · Done · 1");
    expect(content).toContain("Draft · Pending · 1");
    expect(content).toContain("Unassigned");
    expect(content).toContain("Daniel Alvarez");
    expect(content).toContain("&lt;script&gt;");
    expect(content).not.toContain("<script>");
    expect(content).toContain("taskId=task%261");
    expect(content).not.toContain('&quot;completed&quot;');
    expect(result.content[1]).toEqual({ type: "text", text: JSON.stringify(rows, null, 2) });
 });

it("defaults to Markdown even for SVG-capable clients and retains full structured data", () => {
  const result = informationResponse("list_tickets", [{ ...ticket, completed: true, priority: "high", list: { title: "Draft" } }], undefined, { experimental: { [SVG_CAPABILITY]: { supported: true } } });
  expect(result.content[0]).toMatchObject({ type: "text", text: expect.stringContaining("| Ticket | Status | Priority | List | Assignee | QA | Due date |") });
  expect(result.content[0]).toMatchObject({ type: "text", text: expect.stringContaining("🟢 **Done**") });
  expect(result.content[0]).toMatchObject({ text: expect.stringContaining("🟠 **High**") });
  expect(result.structuredContent?.data).toEqual([{ ...ticket, completed: true, priority: "high", list: { title: "Draft" } }]);
});
it("escapes table delimiters, HTML, newlines and Markdown links in untrusted data", () => {
  const result = informationResponse("list_tickets", [{ ...ticket, title: "[bad](javascript:alert(1)) | <img>\nother", completed: false }], { format: "markdown" }, undefined);
  const content = (result.content[0] as { text: string }).text;
  expect(content).toContain("&#124;");
  expect(content).toContain("&lt;img&gt;");
  expect(content).not.toContain("[bad](javascript:");
  expect(content).toContain("🟡 **Pending**");
});
