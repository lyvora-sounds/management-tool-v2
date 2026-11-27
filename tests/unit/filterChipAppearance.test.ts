import { describe, expect, it } from "vitest";
import { filterChipAppearance } from "@/app/(routes)/(dashboard)/board/[boardId]/components/BoardFilters/filterChipAppearance";

describe("filterChipAppearance", () => {
  it("uses the epic color with light text when an epic is selected", () => {
    const appearance = filterChipAppearance("epic", "#ef4444");
    expect(appearance.style).toEqual({ backgroundColor: "#ef4444" });
    expect(appearance.className).toContain("text-white");
  });

  it("uses the label color with light text", () => {
    const appearance = filterChipAppearance("label", "#22c55e");
    expect(appearance.style).toEqual({ backgroundColor: "#22c55e" });
    expect(appearance.className).toContain("text-white");
  });

  it("gives non-entity chips a distinct colored tone without inline style", () => {
    for (const kind of ["archive", "member", "due", "quarter"] as const) {
      const appearance = filterChipAppearance(kind);
      expect(appearance.style).toBeUndefined();
      expect(appearance.className).toMatch(/bg-/);
      expect(appearance.className).toContain("text-white");
    }
  });
});
