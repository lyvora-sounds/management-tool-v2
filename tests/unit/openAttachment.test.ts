import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isInlineType, looksInline, showAttachment } from "@/lib/openAttachment";

describe("which files open in a tab", () => {
  it("only plain images, PDFs and text, whatever the parameters", () => {
    for (const type of ["image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf", "text/plain; charset=utf-8", "IMAGE/PNG"]) {
      expect(isInlineType(type)).toBe(true);
    }
    for (const type of ["text/html", "image/svg+xml", "application/javascript", "application/xhtml+xml", "application/zip", "", null, undefined]) {
      expect(isInlineType(type)).toBe(false);
    }
  });

  it("guesses from the name whether to open the tab before asking for the file", () => {
    expect(["a.PNG", "b.jpeg", "c.pdf", "d.txt", "e.webp"].every(looksInline)).toBe(true);
    expect(["a.html", "b.svg", "c.zip", "noext"].some(looksInline)).toBe(false);
  });
});

describe("showing or saving the file the API sent", () => {
  const created: string[] = [];
  let clicked: { download: string; href: string }[] = [];

  beforeEach(() => {
    created.length = 0;
    clicked = [];
    vi.useFakeTimers();
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn((blob: Blob) => {
        created.push(blob.type);
        return `blob:test/${created.length}`;
      }),
      revokeObjectURL: vi.fn(),
    });
    // Tests run in Node: a link is an object that records what was clicked.
    vi.stubGlobal("document", {
      createElement: () => {
        const link = { href: "", download: "", click: () => clicked.push({ download: link.download, href: link.href }), remove: () => {} };
        return link;
      },
      body: { append: () => {} },
    });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const answer = (body: string, type: string, status = 200) => new Response(body, { status, headers: { "content-type": type } });
  const tab = () => ({ location: { href: "" }, close: vi.fn() }) as unknown as Window;

  it("opens an image or PDF in the tab it was given", async () => {
    const t = tab();
    expect(await showAttachment(answer("x", "application/pdf"), "plan.pdf", t)).toBe(true);
    expect(t.location.href).toBe("blob:test/1");
    expect(created).toEqual(["application/pdf"]);
    expect(clicked).toEqual([]);
  });

  it("saves a page as a download and never opens it, even if the server said it was HTML", async () => {
    const t = tab();
    expect(await showAttachment(answer("<script>alert(1)</script>", "text/html"), "evil.html", t)).toBe(true);
    expect(created).toEqual(["application/octet-stream"]);
    expect(t.location.href).toBe("");
    expect(t.close).toHaveBeenCalled();
    expect(clicked).toEqual([{ download: "evil.html", href: "blob:test/1" }]);
  });

  it("saves an SVG as a download too", async () => {
    await showAttachment(answer("<svg onload=alert(1)/>", "image/svg+xml"), "x.svg", null);
    expect(created).toEqual(["application/octet-stream"]);
    expect(clicked[0]!.download).toBe("x.svg");
  });

  it("saves an inline type when there is no tab to open it in", async () => {
    await showAttachment(answer("x", "image/png"), "pixel.png", null);
    expect(clicked).toEqual([{ download: "pixel.png", href: "blob:test/1" }]);
  });

  it("reports a bad answer and creates nothing", async () => {
    const t = tab();
    expect(await showAttachment(answer("no", "application/json", 404), "a.pdf", t)).toBe(false);
    expect(created).toEqual([]);
  });

  it("gives the address back after a minute", async () => {
    await showAttachment(answer("x", "image/png"), "p.png", tab());
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(60_000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test/1");
  });
});
