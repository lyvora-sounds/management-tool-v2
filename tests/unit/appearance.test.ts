import { describe, it, expect } from "vitest";
import {
  ACCENTS,
  DEFAULT_APPEARANCE,
  isDarkResolved,
  sanitizeAppearance,
} from "@/lib/appearance";

describe("sanitizeAppearance", () => {
  it("devuelve el tema original cuando no hay nada guardado", () => {
    expect(sanitizeAppearance(null)).toEqual(DEFAULT_APPEARANCE);
    expect(sanitizeAppearance(undefined)).toEqual(DEFAULT_APPEARANCE);
    expect(sanitizeAppearance("basura")).toEqual(DEFAULT_APPEARANCE);
  });

  it("el tema por defecto es claro, neutro y cómodo", () => {
    expect(DEFAULT_APPEARANCE.mode).toBe("light");
    expect(DEFAULT_APPEARANCE.accent).toBe("default");
    expect(DEFAULT_APPEARANCE.density).toBe("comfortable");
    expect(DEFAULT_APPEARANCE.gradients).toBe(true);
    expect(Object.values(DEFAULT_APPEARANCE.card).every(Boolean)).toBe(true);
  });

  it("el estilo por defecto es original y rechaza valores desconocidos", () => {
    expect(DEFAULT_APPEARANCE.style).toBe("original");
    expect(sanitizeAppearance({ style: "glass" }).style).toBe("glass");
    expect(sanitizeAppearance({ style: "soft" }).style).toBe("soft");
    expect(sanitizeAppearance({ style: "sharp" }).style).toBe("sharp");
    expect(sanitizeAppearance({ style: "cristal" }).style).toBe("original");
  });

  it("los degradados solo se desactivan con un false explícito", () => {
    expect(sanitizeAppearance({ gradients: false }).gradients).toBe(false);
    expect(sanitizeAppearance({ gradients: "no" }).gradients).toBe(true);
    expect(sanitizeAppearance({}).gradients).toBe(true);
  });

  it("rechaza valores fuera de las listas cerradas", () => {
    const result = sanitizeAppearance({
      mode: "neon",
      accent: "#ff00ff",
      density: "enorme",
    });
    expect(result.mode).toBe(DEFAULT_APPEARANCE.mode);
    expect(result.accent).toBe(DEFAULT_APPEARANCE.accent);
    expect(result.density).toBe(DEFAULT_APPEARANCE.density);
  });

  it("acepta cada acento declarado", () => {
    for (const accent of ACCENTS) {
      expect(sanitizeAppearance({ accent }).accent).toBe(accent);
    }
  });

  it("conserva los interruptores válidos y rellena los que faltan", () => {
    const result = sanitizeAppearance({
      mode: "dark",
      card: { priority: false, tags: "si", inventado: false },
    });
    expect(result.mode).toBe("dark");
    expect(result.card.priority).toBe(false);
    expect(result.card.tags).toBe(true); // no era booleano: vuelve al defecto
    expect(result.card.dueDate).toBe(true); // faltaba: defecto
    expect("inventado" in result.card).toBe(false);
  });

  it("no comparte referencias con el objeto por defecto", () => {
    const result = sanitizeAppearance({});
    result.card.priority = false;
    expect(DEFAULT_APPEARANCE.card.priority).toBe(true);
  });
});

describe("isDarkResolved", () => {
  it("resuelve el modo sistema según la preferencia del navegador", () => {
    expect(isDarkResolved("system", true)).toBe(true);
    expect(isDarkResolved("system", false)).toBe(false);
    expect(isDarkResolved("dark", false)).toBe(true);
    expect(isDarkResolved("light", true)).toBe(false);
  });
});
