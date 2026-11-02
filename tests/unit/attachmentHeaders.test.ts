import { describe, expect, it } from "vitest";
import { attachmentHeaders } from "@/lib/attachmentHeaders";

describe("how a stored attachment is served", () => {
  it("opens only plain images, PDFs and text in the tab", () => {
    for (const type of ["image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf", "text/plain; charset=utf-8"]) {
      expect(attachmentHeaders("f", type)["content-disposition"]).toMatch(/^inline;/);
    }
  });

  it("makes anything the browser could run a download", () => {
    for (const type of ["text/html", "image/svg+xml", "application/javascript", "application/xhtml+xml", "application/zip", "", null, undefined]) {
      const headers = attachmentHeaders("f", type);
      expect(headers["content-disposition"]).toMatch(/^attachment;/);
      expect(headers["content-type"]).toBe("application/octet-stream");
    }
  });

  it("sends nosniff, a sandboxing policy and no caching", () => {
    const headers = attachmentHeaders("f", "application/pdf");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["content-security-policy"]).toContain("sandbox");
    expect(headers["cache-control"]).toBe("private, no-store");
  });

  it("never lets a file name break out of the header", () => {
    const headers = attachmentHeaders('a"b\r\nSet-Cookie: x=1/../ñ ü.txt', "text/plain");
    expect(headers["content-disposition"]).not.toMatch(/[\r\n]/);
    expect(headers["content-disposition"]).toContain("filename*=UTF-8''");
    expect(attachmentHeaders("", "text/plain")["content-disposition"]).toContain('filename="file"');
  });
});
