import { ONBOARDING_STEPS, type OnboardingStep } from "@/lib/onboarding";

/**
 * Qué elemento señala cada paso del onboarding. La clave es el paso; el valor,
 * el atributo `data-guide` que hay que poner en el control real.
 *
 * Se mantiene aparte de los componentes para que quede en un solo sitio la
 * lista de anclajes que no se pueden renombrar a la ligera.
 */
export const GUIDE_TARGETS: Record<OnboardingStep, string> = {
  createBoard: "create-board",
  addList: "add-list",
  createTicket: "create-task",
  inviteTeammate: "board-members",
  connectAi: "ai-key",
};

export function isGuidedStep(value: string | null | undefined): value is OnboardingStep {
  return !!value && (ONBOARDING_STEPS as readonly string[]).includes(value);
}

/**
 * A dónde lleva cada paso del checklist, con `?guide=` puesto para que al
 * llegar aparezca la flecha sobre el control.
 *
 * Sin tablero todavía, los pasos que ocurren dentro de uno mandan a crearlo:
 * señalar un control que no existe sería peor que no señalar nada.
 */
export function guideHref(step: OnboardingStep, firstBoardId?: string): string {
  switch (step) {
    case "createBoard":
      return "/dashboard/boards?guide=createBoard";
    case "connectAi":
      return "/dashboard/settings?tab=ai&guide=connectAi";
    default:
      return firstBoardId
        ? `/board/${firstBoardId}?guide=${step}`
        : "/dashboard/boards?guide=createBoard";
  }
}
