// Preferencias de apariencia por usuario.
//
// Todo lo personalizable sale de listas cerradas (modo, acento, densidad) y de
// interruptores. No hay colores libres a propósito: cada acento está calibrado
// en globals.css para claro y oscuro, de modo que ninguna combinación rompa el
// contraste ni el aspecto de la interfaz.

export const APPEARANCE_COOKIE = "kiki_appearance";

export const THEME_MODES = ["system", "light", "dark"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

// "default" es el tema base del workspace (índigo suave): no aplica ningún
// override. Los demás cambian solo el tono sobre esa misma receta de colores.
export const ACCENTS = [
  "default",
  "blue",
  "emerald",
  "rose",
  "amber",
  "graphite",
] as const;
export type Accent = (typeof ACCENTS)[number];

export const DENSITIES = ["comfortable", "compact"] as const;
export type Density = (typeof DENSITIES)[number];

// Estilo de superficies: cambia radios, sombras, bordes y translucidez, no los
// colores. Se combina con el modo, el acento y la densidad.
export const STYLES = ["original", "glass", "soft", "sharp"] as const;
export type Style = (typeof STYLES)[number];

export const CARD_FIELDS = [
  "priority",
  "dueDate",
  "subtasks",
  "activity",
  "people",
  "tags",
] as const;
export type CardField = (typeof CARD_FIELDS)[number];

export type Appearance = {
  mode: ThemeMode;
  accent: Accent;
  density: Density;
  style: Style;
  // Degradados, fondos con tinte y halos difuminados. false = superficies planas.
  gradients: boolean;
  card: Record<CardField, boolean>;
};

export const DEFAULT_APPEARANCE: Appearance = {
  mode: "light",
  accent: "default",
  density: "comfortable",
  style: "original",
  gradients: true,
  card: {
    priority: true,
    dueDate: true,
    subtasks: true,
    activity: true,
    people: true,
    tags: true,
  },
};

// Muestra del color en el selector (solo decorativo; el color real de la
// interfaz vive en globals.css). Aproximación sRGB del primario en claro.
export const ACCENT_SWATCH: Record<Accent, string> = {
  default: "#48528f",
  blue: "#1c5c8c",
  emerald: "#00694a",
  rose: "#863d4b",
  amber: "#7c4b02",
  graphite: "#56585e",
};

function pick<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

// Acepta cualquier cosa (JSON de la base, cookie, cuerpo de petición) y
// devuelve siempre un Appearance válido. Lo desconocido cae al valor por
// defecto, así una cookie vieja o manipulada nunca rompe el render.
export function sanitizeAppearance(input: unknown): Appearance {
  const raw =
    input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const rawCard =
    raw.card && typeof raw.card === "object"
      ? (raw.card as Record<string, unknown>)
      : {};

  const card = { ...DEFAULT_APPEARANCE.card };
  for (const field of CARD_FIELDS) {
    if (typeof rawCard[field] === "boolean") card[field] = rawCard[field] as boolean;
  }

  return {
    mode: pick(raw.mode, THEME_MODES, DEFAULT_APPEARANCE.mode),
    accent: pick(raw.accent, ACCENTS, DEFAULT_APPEARANCE.accent),
    density: pick(raw.density, DENSITIES, DEFAULT_APPEARANCE.density),
    style: pick(raw.style, STYLES, DEFAULT_APPEARANCE.style),
    gradients:
      typeof raw.gradients === "boolean"
        ? raw.gradients
        : DEFAULT_APPEARANCE.gradients,
    card,
  };
}

export function isDarkResolved(mode: ThemeMode, systemDark: boolean): boolean {
  return mode === "dark" || (mode === "system" && systemDark);
}
