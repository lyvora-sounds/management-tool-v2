/**
 * Local-first cache + outbox are on by default in the browser.
 * Set NEXT_PUBLIC_LOCAL_FIRST=0 to disable. SSE still needs NEXT_PUBLIC_API_URL.
 */
export function isLocalFirstEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_LOCAL_FIRST;
  if (flag === "0" || flag === "false") return false;
  return true;
}

export function isBoardEventStreamConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_API_URL?.trim());
}
