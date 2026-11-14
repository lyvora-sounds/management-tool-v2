/**
 * Local-first is opt-in. Set NEXT_PUBLIC_LOCAL_FIRST=1 to enable IndexedDB cache + outbox.
 * SSE still needs NEXT_PUBLIC_API_URL.
 */
export function isLocalFirstEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_LOCAL_FIRST;
  return flag === "1" || flag === "true";
}

export function isBoardEventStreamConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_API_URL?.trim());
}
