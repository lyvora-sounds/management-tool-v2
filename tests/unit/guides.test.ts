import { describe, it, expect } from "vitest";
import { ONBOARDING_STEPS } from "@/lib/onboarding";
import {
  GUIDE_TARGETS,
  guideHref,
  isGuidedStep,
} from "@/components/Shared/GuidePointer/guides";

describe("GUIDE_TARGETS", () => {
  it("cubre todos los pasos del onboarding", () => {
    // Si alguien añade un paso y olvida el anclaje, el checklist enlazaría a
    // un ?guide= que no señala nada.
    for (const step of ONBOARDING_STEPS) {
      expect(GUIDE_TARGETS[step], `falta el anclaje de ${step}`).toBeTruthy();
    }
    expect(Object.keys(GUIDE_TARGETS)).toHaveLength(ONBOARDING_STEPS.length);
  });

  it("no repite anclajes entre pasos", () => {
    const values = Object.values(GUIDE_TARGETS);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("isGuidedStep", () => {
  it("solo acepta pasos reales", () => {
    expect(isGuidedStep("createBoard")).toBe(true);
    expect(isGuidedStep("connectAi")).toBe(true);
    expect(isGuidedStep("inventado")).toBe(false);
    expect(isGuidedStep("")).toBe(false);
    expect(isGuidedStep(null)).toBe(false);
    expect(isGuidedStep(undefined)).toBe(false);
  });
});

describe("guideHref", () => {
  it("lleva a la página de tableros para crear el primero", () => {
    expect(guideHref("createBoard", "b1")).toBe("/dashboard/boards?guide=createBoard");
  });

  it("abre ajustes ya en la pestaña de IA", () => {
    // Sin tab=ai el usuario aterriza en la pestaña de cuenta y no ve el campo
    // que la flecha intenta señalar.
    expect(guideHref("connectAi", "b1")).toBe(
      "/dashboard/settings?tab=ai&guide=connectAi"
    );
  });

  it("lleva al tablero los pasos que ocurren dentro de uno", () => {
    expect(guideHref("addList", "b1")).toBe("/board/b1?guide=addList");
    expect(guideHref("createTicket", "b1")).toBe("/board/b1?guide=createTicket");
    expect(guideHref("inviteTeammate", "b1")).toBe("/board/b1?guide=inviteTeammate");
  });

  it("sin ningún tablero, redirige a crear uno antes", () => {
    // Señalar "añade una lista" sin tablero llevaría a una pantalla sin ese
    // control: primero hay que tener dónde ponerla.
    for (const step of ["addList", "createTicket", "inviteTeammate"] as const) {
      expect(guideHref(step, undefined)).toBe("/dashboard/boards?guide=createBoard");
    }
  });

  it("cada destino incluye un guide= que isGuidedStep reconoce", () => {
    for (const step of ONBOARDING_STEPS) {
      const href = guideHref(step, "b1");
      const guide = new URLSearchParams(href.split("?")[1]).get("guide");
      expect(isGuidedStep(guide), `${step} -> ${href}`).toBe(true);
    }
  });
});
