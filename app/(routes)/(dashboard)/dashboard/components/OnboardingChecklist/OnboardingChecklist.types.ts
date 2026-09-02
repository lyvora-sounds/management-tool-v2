import type { OnboardingState } from "@/lib/onboarding";

export interface OnboardingChecklistProps {
  state: OnboardingState;
  /** Tablero al que llevan los pasos que se hacen dentro de uno. */
  firstBoardId?: string;
}
