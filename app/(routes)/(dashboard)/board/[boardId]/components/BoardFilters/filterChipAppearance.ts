export type FilterChipKind = "archive" | "member" | "due" | "quarter" | "epic" | "label";

const TONES: Record<Exclude<FilterChipKind, "epic" | "label">, string> = {
  archive: "bg-violet-600 text-white hover:bg-violet-600/90",
  member: "bg-sky-600 text-white hover:bg-sky-600/90",
  due: "bg-amber-600 text-white hover:bg-amber-600/90",
  quarter: "bg-teal-600 text-white hover:bg-teal-600/90",
};

/** Visual style for an active filter chip. Epics and labels keep their entity color. */
export function filterChipAppearance(
  kind: FilterChipKind,
  color?: string,
): { className: string; style?: { backgroundColor: string } } {
  if ((kind === "epic" || kind === "label") && color) {
    return {
      className: "h-7 gap-1 text-xs cursor-pointer text-white border-transparent",
      style: { backgroundColor: color },
    };
  }
  if (kind === "epic" || kind === "label") {
    return { className: "h-7 gap-1 text-xs cursor-pointer bg-secondary text-secondary-foreground" };
  }
  return { className: `h-7 gap-1 text-xs cursor-pointer border-transparent ${TONES[kind]}` };
}
