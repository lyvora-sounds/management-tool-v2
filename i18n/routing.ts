export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function localeFromAcceptLanguage(header: string | null | undefined): Locale | undefined {
  if (!header) return undefined;

  const tags = header
    .split(",")
    .map((part) => {
      const [tag, qValue] = part.trim().split(";q=");
      return { tag: tag.trim().toLowerCase(), q: qValue ? Number(qValue) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of tags) {
    const short = tag.slice(0, 2);
    if (isLocale(short)) return short;
  }

  return undefined;
}

export function dateLocale(locale: string): string {
  return locale === "es" ? "es-ES" : "en-US";
}

export const localeDetails: Record<Locale, { label: string; flag: string; shortCode: string }> = {
  en: {
    label: "English",
    flag: "🇺🇸",
    shortCode: "EN",
  },
  es: {
    label: "Español",
    flag: "🇪🇸",
    shortCode: "ES",
  },
};
