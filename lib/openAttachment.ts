// What the browser may show in a tab. The server decides the same way (kiki-api, src/lib/attachmentHeaders.ts),
// but this app also still talks to its own older route, so the browser does not trust the type it is given:
// anything else is saved to disk, never opened, because an opened page would run on this origin.
const INLINE_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf", "text/plain"]);

export function isInlineType(contentType: string | null | undefined): boolean {
  return INLINE_TYPES.has((contentType ?? "").split(";")[0]!.trim().toLowerCase());
}

/** Whether a file name looks like something that opens in a tab, to open the tab before the download is known. */
export function looksInline(filename: string): boolean {
  return /\.(png|jpe?g|gif|webp|pdf|txt)$/i.test(filename);
}

/** Opens the file in `tab` when it is safe to show, otherwise saves it under its name. Returns false on a bad answer. */
export async function showAttachment(response: Response, filename: string, tab: Window | null): Promise<boolean> {
  if (!response.ok) return false;
  const type = response.headers.get("content-type");
  const inline = isInlineType(type);
  const blob = inline ? await response.blob() : new Blob([await response.arrayBuffer()], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);

  if (inline && tab) {
    tab.location.href = url;
  } else {
    tab?.close();
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
  }
  // The tab needs the URL for as long as it is loading; a minute is plenty.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}
