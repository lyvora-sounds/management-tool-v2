export function parseListValue(val: string | null | undefined): string[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    return val.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return val ? [val] : [];
}

export function stringifyListValue(list: string[]): string {
  const clean = Array.from(new Set(list.map((s) => s.trim()).filter(Boolean)));
  return JSON.stringify(clean);
}
