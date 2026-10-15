import { describe, expect, it } from "vitest";
import {
  allTicketIndexes,
  applyEpicToSelected,
  shiftCreatingFor,
  shiftSelection,
  toggleTicketIndex,
} from "@/app/(routes)/(dashboard)/board/[boardId]/components/AiBrainDumpModal/epicSelection";

describe("epic selection", () => {
  it("starts with every detected ticket", () => {
    expect(allTicketIndexes(3)).toEqual([0, 1, 2]);
  });

  it("toggles one ticket without changing the others", () => {
    expect(toggleTicketIndex([0, 1, 2], 1)).toEqual([0, 2]);
    expect(toggleTicketIndex([0, 2], 1)).toEqual([0, 1, 2]);
  });

  it("keeps selection aligned when a ticket is discarded", () => {
    expect(shiftSelection([0, 2, 3], 1)).toEqual([0, 1, 2]);
    expect(shiftCreatingFor(3, 1)).toBe(2);
    expect(shiftCreatingFor(1, 1)).toBeNull();
  });

  it("assigns the epic only to the selected tickets", () => {
    const tasks = [
      { title: "A", targetEpicId: "old" },
      { title: "B", targetEpicId: null },
      { title: "C", targetEpicId: "keep" },
    ];

    expect(applyEpicToSelected(tasks, [0, 2], "epic-1")).toEqual([
      { title: "A", targetEpicId: "epic-1" },
      { title: "B", targetEpicId: null },
      { title: "C", targetEpicId: "epic-1" },
    ]);
  });
});
