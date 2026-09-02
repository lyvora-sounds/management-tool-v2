import db from "@/lib/db";
import {
  ONBOARDING_STEPS,
  type OnboardingState,
  type OnboardingStep,
} from "@/lib/onboarding";

/**
 * Deriva el progreso de los datos reales en vez de guardarlo como una lista de
 * checkboxes. Así un usuario que ya llevaba meses usando la app no ve una
 * tarjeta pidiéndole que cree su primer tablero, y nada se puede desincronizar
 * si alguien borra un tablero o una invitación.
 *
 * Solo servidor: toca `db`.
 */
export async function getOnboardingState(userId: string): Promise<OnboardingState> {
  const [boardCount, listCount, taskCount, memberCount, invitationCount, settings] =
    await Promise.all([
      db.board.count({ where: { userId } }),
      db.list.count({ where: { board: { userId } } }),
      db.task.count({ where: { list: { board: { userId } } } }),
      // Miembros de mis tableros sin contarme a mí: el propietario no tiene
      // fila en BoardMember, así que cualquier fila ya es alguien invitado.
      db.boardMember.count({ where: { board: { userId } } }),
      db.invitation.count({ where: { board: { userId } } }),
      db.userSettings.findUnique({
        where: { userId },
        select: { aiApiKey: true, onboardingDismissedAt: true, tourSeenAt: true },
      }),
    ]);

  const done: Record<OnboardingStep, boolean> = {
    createBoard: boardCount > 0,
    addList: listCount > 0,
    createTicket: taskCount > 0,
    // Vale con haber invitado, aunque la otra persona no haya aceptado: el
    // paso que enseñamos es invitar, no que el otro conteste.
    inviteTeammate: memberCount > 0 || invitationCount > 0,
    connectAi: Boolean(settings?.aiApiKey),
  };

  const completedCount = ONBOARDING_STEPS.filter((step) => done[step]).length;

  return {
    done,
    completedCount,
    total: ONBOARDING_STEPS.length,
    isComplete: completedCount === ONBOARDING_STEPS.length,
    dismissed: Boolean(settings?.onboardingDismissedAt),
    tourSeen: Boolean(settings?.tourSeenAt),
  };
}
