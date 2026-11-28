import { isFunctionalStorageAllowed } from "@/lib/cookieConsent";

/** The person's choice about the comments panel of a ticket. One value for every ticket. */
export const COMMENTS_PANEL_KEY = "kiki.comments.open";

/**
 * Whether the comments panel is open. An explicit choice ("1" or "0") wins for every ticket; with none, the panel
 * is open when the ticket has comments and out of the way when it has none.
 */
export function resolveCommentsOpen(stored: string | null, commentCount: number): boolean {
  if (stored === "1") return true;
  if (stored === "0") return false;
  return commentCount > 0;
}

export function readCommentsPanel(): string | null {
  try {
    return localStorage.getItem(COMMENTS_PANEL_KEY);
  } catch {
    return null;
  }
}

/** Remembers the choice only if the person allowed functional storage (see lib/cookieConsent.ts). */
export function writeCommentsPanel(open: boolean): void {
  try {
    if (!isFunctionalStorageAllowed()) return;
    localStorage.setItem(COMMENTS_PANEL_KEY, open ? "1" : "0");
  } catch {
    // No storage: the choice lasts only until the modal closes.
  }
}
