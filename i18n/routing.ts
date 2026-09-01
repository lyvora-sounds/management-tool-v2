export const locales = ["en", "es", "tl"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

const localeAliases: Record<string, Locale> = {
  fil: "tl",
};

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
    const primary = tag.split("-")[0];
    const aliased = localeAliases[primary];
    if (aliased) return aliased;
    if (isLocale(primary)) return primary;
  }

  return undefined;
}

const dateLocales: Record<Locale, string> = {
  en: "en-US",
  es: "es-ES",
  tl: "tl-PH",
};

export function dateLocale(locale: string): string {
  return isLocale(locale) ? dateLocales[locale] : dateLocales.en;
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
  tl: {
    label: "Tagalog",
    flag: "🇵🇭",
    shortCode: "TL",
  },
};
