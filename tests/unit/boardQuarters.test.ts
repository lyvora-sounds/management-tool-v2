import { describe, expect, it } from "vitest";
import {
  assignmentMismatch,
  dateInQuarterRange,
  defaultCalendarQuarters,
  formatQuarterOptionLabel,
  quarterYearsAroundCurrent,
  toQuarterRanges,
} from "@/lib/boardQuarters";

describe("defaultCalendarQuarters", () => {
  it("recommends calendar-year UTC bounds for a year", () => {
    const q = defaultCalendarQuarters(2026);
    expect(q.map((r) => r.key)).toEqual(["2026-Q1", "2026-Q2", "2026-Q3", "2026-Q4"]);
    expect(q[0]!.startDate.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(q[0]!.endDate.toISOString()).toBe("2026-03-31T23:59:59.999Z");
  });
});

describe("dateInQuarterRange", () => {
  it("allows fiscal ranges that cross calendar years", () => {
    const range = {
      key: "2026-Q4",
      startDate: new Date("2026-11-01T00:00:00.000Z"),
      endDate: new Date("2027-01-31T23:59:59.999Z"),
    };
    expect(dateInQuarterRange(new Date("2027-01-15T12:00:00.000Z"), range)).toBe(true);
    expect(dateInQuarterRange(new Date("2026-10-15T12:00:00.000Z"), range)).toBe(false);
  });

  it("allows Q1 that starts in February", () => {
    const range = {
      key: "2026-Q1",
      startDate: new Date("2026-02-01T00:00:00.000Z"),
      endDate: new Date("2026-04-30T23:59:59.999Z"),
    };
    expect(dateInQuarterRange(new Date("2026-02-01T00:00:00.000Z"), range)).toBe(true);
    expect(dateInQuarterRange(new Date("2026-01-15T00:00:00.000Z"), range)).toBe(false);
  });
});

describe("quarterYearsAroundCurrent", () => {
  it("returns current UTC year ± 1", () => {
    const y = 2026;
    expect(quarterYearsAroundCurrent(y)).toEqual([2025, 2026, 2027]);
  });
});

describe("formatQuarterOptionLabel", () => {
  it("includes the key and both dates so cross-year ends are visible", () => {
    const label = formatQuarterOptionLabel(
      {
        key: "2026-Q4",
        startDate: "2026-11-01T00:00:00.000Z",
        endDate: "2027-01-31T23:59:59.999Z",
      },
      "en-US",
    );
    expect(label).toContain("2026-Q4");
    expect(label).toMatch(/2026/);
    expect(label).toMatch(/2027/);
  });
});

describe("assignmentMismatch", () => {
  const calendar = toQuarterRanges([
    {
      key: "2026-Q4",
      startDate: "2026-11-01T00:00:00.000Z",
      endDate: "2027-01-31T23:59:59.999Z",
    },
  ]);

  it("returns null when no quarter is set", () => {
    expect(
      assignmentMismatch(null, { startDate: new Date("2026-12-01T00:00:00.000Z") }, calendar),
    ).toBeNull();
  });

  it("returns unknown for keys missing from the board calendar", () => {
    expect(assignmentMismatch("2025-Q1", { startDate: null, dueDate: null }, calendar)).toBe(
      "unknown",
    );
  });

  it("returns mismatch when a ticket date falls outside the quarter", () => {
    expect(
      assignmentMismatch(
        "2026-Q4",
        { startDate: new Date("2026-10-01T00:00:00.000Z"), dueDate: null },
        calendar,
      ),
    ).toBe("mismatch");
  });

  it("returns null when dates fall inside the quarter", () => {
    expect(
      assignmentMismatch(
        "2026-Q4",
        {
          startDate: new Date("2026-11-15T00:00:00.000Z"),
          dueDate: new Date("2027-01-10T00:00:00.000Z"),
        },
        calendar,
      ),
    ).toBeNull();
  });
});
