export function parseListValue(val: string | null | undefined): string[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return val ? [val] : [];
}

export function stringifyListValue(list: string[]): string {
  const clean = Array.from(new Set(list.map((s) => s.trim()).filter(Boolean)));
  return JSON.stringify(clean);
}

export function displayCustomFieldValue(
  value: string,
  defaultKey: string | null | undefined,
  titleById?: Map<string, string>,
): string {
  if (defaultKey === "parent") {
    return titleById?.get(value) ?? value;
  }
  if (defaultKey === "child") {
    return parseListValue(value)
      .map((id) => titleById?.get(id) ?? id)
      .join(", ");
  }
  if (value.startsWith("[")) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).join(", ");
    } catch {
      // keep the raw value
    }
  }
  return value;
}
