export const QUARTER_KEY_RE = /^\d{4}-Q[1-4]$/;

export type BoardQuarterRange = { key: string; startDate: Date; endDate: Date };

export type BoardQuarterDto = {
  id?: string;
  key: string;
  startDate: string;
  endDate: string;
};

const CALENDAR_QUARTER_BOUNDS = [
  { quarter: 1, startMonth: 0, startDay: 1, endMonth: 2, endDay: 31 },
  { quarter: 2, startMonth: 3, startDay: 1, endMonth: 5, endDay: 30 },
  { quarter: 3, startMonth: 6, startDay: 1, endMonth: 8, endDay: 30 },
  { quarter: 4, startMonth: 9, startDay: 1, endMonth: 11, endDay: 31 },
] as const;

/** Recommended calendar-year ranges (Q1 starts 1 Jan UTC). Boards may edit to fiscal calendars. */
export function defaultCalendarQuarters(year: number): BoardQuarterRange[] {
  return CALENDAR_QUARTER_BOUNDS.map(({ quarter, startMonth, startDay, endMonth, endDay }) => ({
    key: `${year}-Q${quarter}`,
    startDate: new Date(Date.UTC(year, startMonth, startDay, 0, 0, 0, 0)),
    endDate: new Date(Date.UTC(year, endMonth, endDay, 23, 59, 59, 999)),
  }));
}

export function defaultQuarterRows(year: number): BoardQuarterDto[] {
  return defaultCalendarQuarters(year).map(({ key, startDate, endDate }) => ({
    key,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  }));
}

function utcCalendarDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Inclusive by UTC calendar day — ranges may cross calendar years. */
export function dateInQuarterRange(date: Date, range: BoardQuarterRange): boolean {
  const day = utcCalendarDay(date);
  return day >= utcCalendarDay(range.startDate) && day <= utcCalendarDay(range.endDate);
}

export function quarterYearsAroundCurrent(currentUtcYear = new Date().getUTCFullYear()): number[] {
  return [currentUtcYear - 1, currentUtcYear, currentUtcYear + 1];
}

export function formatQuarterOptionLabel(
  quarter: { key: string; startDate: string; endDate: string },
  locale = "en-US",
): string {
  const start = new Date(quarter.startDate).toLocaleDateString(locale, { dateStyle: "medium", timeZone: "UTC" });
  const end = new Date(quarter.endDate).toLocaleDateString(locale, { dateStyle: "medium", timeZone: "UTC" });
  return `${quarter.key} · ${start} – ${end}`;
}

export function toQuarterRanges(quarters: BoardQuarterDto[]): BoardQuarterRange[] {
  return quarters.map((quarter) => ({
    key: quarter.key,
    startDate: new Date(quarter.startDate),
    endDate: new Date(quarter.endDate),
  }));
}

export function assignmentMismatch(
  quarterKey: string | null | undefined,
  dates: { startDate?: Date | null; dueDate?: Date | null },
  calendar: BoardQuarterRange[],
): "unknown" | "mismatch" | null {
  const key = quarterKey?.trim() || null;
  if (!key) return null;
  const range = calendar.find((entry) => entry.key === key);
  if (!range) return "unknown";
  if (dates.startDate && !dateInQuarterRange(dates.startDate, range)) return "mismatch";
  if (dates.dueDate && !dateInQuarterRange(dates.dueDate, range)) return "mismatch";
  return null;
}
