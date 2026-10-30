const TRANSIENT_MARKERS = [
  "connection terminated unexpectedly",
  "econnreset",
  "econnrefused",
  "etimedout",
  "client network socket disconnected",
  "connection closed",
  "server closed the connection",
  "timeout exceeded when trying to connect",
];

/** Neon closes idle sockets. The next query on that socket fails once, then a new connection works. */
export function isTransientDbError(error: unknown) {
  const record = typeof error === "object" && error !== null ? (error as { code?: unknown; message?: unknown }) : {};
  const code = typeof record.code === "string" ? record.code : "";
  const message =
    error instanceof Error ? error.message : typeof record.message === "string" ? record.message : String(error ?? "");
  const haystack = `${code} ${message}`.toLowerCase();
  return TRANSIENT_MARKERS.some((marker) => haystack.includes(marker));
}
