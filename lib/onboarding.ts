/**
 * Modelo del onboarding, sin dependencias: lo importan tanto el servidor como
 * los componentes cliente. La consulta a la base vive aparte, en
 * `lib/onboardingState.ts`, porque importar `db` desde aquí arrastraría `pg`
 * al bundle del navegador.
 */

/**
 * Pasos de la tarjeta "Primeros pasos". El orden es el del recorrido real:
 * sin tablero no hay lista, sin lista no hay ticket.
 */
export const ONBOARDING_STEPS = [
  "createBoard",
  "addList",
  "createTicket",
  "inviteTeammate",
  "connectAi",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export type OnboardingState = {
  done: Record<OnboardingStep, boolean>;
  completedCount: number;
  total: number;
  /** Todos los pasos hechos: la tarjeta se despide sola. */
  isComplete: boolean;
  /** El usuario cerró la tarjeta a mano. */
  dismissed: boolean;
  /** Ya vio o saltó el tour del tablero. */
  tourSeen: boolean;
};

/** Primer paso sin hacer, que es el que la tarjeta destaca. */
export function nextStep(done: Record<OnboardingStep, boolean>): OnboardingStep | null {
  return ONBOARDING_STEPS.find((step) => !done[step]) ?? null;
}
