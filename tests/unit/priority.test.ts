import { describe, it, expect } from "vitest";
import {
  getPriority,
  PRIORITIES,
} from "@/app/(routes)/(dashboard)/board/[boardId]/components/TaskPriority/TaskPriority.constants";

describe("getPriority", () => {
  it("devuelve la prioridad correspondiente a cada valor válido", () => {
    for (const p of PRIORITIES) {
      expect(getPriority(p.value)).toBe(p);
    }
  });

  it("devuelve null cuando no hay prioridad asignada", () => {
    // La columna Task.priority es nullable, así que estos son casos reales.
    expect(getPriority(null)).toBeNull();
    expect(getPriority(undefined)).toBeNull();
    expect(getPriority("")).toBeNull();
  });

  it("devuelve null ante un valor desconocido en vez de romper", () => {
    expect(getPriority("altísima")).toBeNull();
    expect(getPriority("URGENT")).toBeNull(); // distingue mayúsculas
  });
});

describe("PRIORITIES", () => {
  it("no tiene valores duplicados", () => {
    const values = PRIORITIES.map((p) => p.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it("cubre los cuatro niveles esperados", () => {
    expect(PRIORITIES.map((p) => p.value)).toEqual([
      "urgent",
      "high",
      "medium",
      "low",
    ]);
  });

  it("cada nivel trae etiqueta y color utilizables", () => {
    for (const p of PRIORITIES) {
      expect(p.label.length).toBeGreaterThan(0);
      expect(p.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(p.bg.length).toBeGreaterThan(0);
    }
  });
});
