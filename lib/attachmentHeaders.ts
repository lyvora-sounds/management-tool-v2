// Copied from kiki-api (src/lib/attachmentHeaders.ts), which serves the same files.
// What a stored file may be shown as. The type was chosen by whoever uploaded it, and the file is served by the
// API, so anything the browser could run (HTML, SVG, scripts) must download, never render.
const INLINE_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf", "text/plain"]);

/** The media type without parameters, lower case. */
export function mediaType(contentType: string | null | undefined): string {
  return (contentType ?? "").split(";")[0]!.trim().toLowerCase();
}

/** Headers for sending a stored file back: it opens in the tab only when it is a plain image, PDF or text. */
export function attachmentHeaders(filename: string, storedContentType: string | null | undefined) {
  const type = mediaType(storedContentType);
  const inline = INLINE_TYPES.has(type);
  // ASCII fallback first, then the exact name as RFC 5987 UTF-8. Quotes, slashes and control characters never
  // reach a header value.
  const fallback = filename.replace(/[^\x20-\x7e]|["\\/]/g, "_") || "file";
  const encoded = encodeURIComponent(filename).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return {
    "content-type": inline ? type : "application/octet-stream",
    "content-disposition": `${inline ? "inline" : "attachment"}; filename="${fallback}"; filename*=UTF-8''${encoded}`,
    "x-content-type-options": "nosniff",
    // Even a file shown inline gets no scripts, no frames and no network.
    "content-security-policy": "default-src 'none'; sandbox",
    "cache-control": "private, no-store",
  };
}
