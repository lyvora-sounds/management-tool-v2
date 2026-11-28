import { describe, expect, it } from "vitest";
import { resolveCommentsOpen } from "@/lib/commentsPanel";
import { OPTIONAL_LOCAL_STORAGE_KEYS } from "@/lib/cookieConsent";
import { COMMENTS_PANEL_KEY } from "@/lib/commentsPanel";

describe("resolveCommentsOpen", () => {
  it("is open when the ticket has comments and no choice was made", () => {
    expect(resolveCommentsOpen(null, 3)).toBe(true);
  });

  it("is out of the way when the ticket has none and no choice was made", () => {
    expect(resolveCommentsOpen(null, 0)).toBe(false);
  });

  it("follows the explicit choice for every ticket, whatever the count", () => {
    expect(resolveCommentsOpen("0", 12)).toBe(false);
    expect(resolveCommentsOpen("1", 0)).toBe(true);
  });

  it("ignores a stored value it does not know", () => {
    expect(resolveCommentsOpen("maybe", 2)).toBe(true);
    expect(resolveCommentsOpen("", 0)).toBe(false);
  });
});

describe("the preference is functional storage", () => {
  it("is cleared with the other optional keys when the person rejects functional storage", () => {
    expect(OPTIONAL_LOCAL_STORAGE_KEYS).toContain(COMMENTS_PANEL_KEY);
  });
});
