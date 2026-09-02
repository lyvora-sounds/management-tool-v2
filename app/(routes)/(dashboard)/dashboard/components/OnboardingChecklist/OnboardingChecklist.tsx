"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  X,
  ArrowRight,
  LayoutDashboard,
  Columns3,
  SquareCheck,
  UserPlus,
  Sparkles,
  PartyPopper,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ONBOARDING_STEPS, type OnboardingStep } from "@/lib/onboarding";
import { guideHref } from "@/components/Shared/GuidePointer";
import type { OnboardingChecklistProps } from "./OnboardingChecklist.types";

const STEP_ICON: Record<OnboardingStep, React.ElementType> = {
  createBoard: LayoutDashboard,
  addList: Columns3,
  createTicket: SquareCheck,
  inviteTeammate: UserPlus,
  connectAi: Sparkles,
};

export function OnboardingChecklist({ state, firstBoardId }: OnboardingChecklistProps) {
  const t = useTranslations("onboarding");
  const [hidden, setHidden] = useState(false);


  const dismiss = async () => {
    setHidden(true);
    await fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dismissed: true }),
    }).catch(() => {
      // Si falla, la tarjeta ya se ha ido de la vista y volverá en la próxima
      // carga. Es mejor eso que dejar al usuario mirando un botón que no hace
      // nada, y no hay nada que reintentar aquí.
    });
  };

  const pct = Math.round((state.completedCount / state.total) * 100);
  const firstPending = ONBOARDING_STEPS.find((s) => !state.done[s]) ?? null;

  return (
    <AnimatePresence initial={false}>
      {!hidden && (
        <motion.section
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginBottom: -24 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative overflow-hidden rounded-2xl border bg-card"
          aria-label={t("title")}
        >
          {/* Halo de color: el mismo gesto del Hero, sin robar atención a los
              datos del dashboard. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-3xl"
          />

          <div className="relative flex flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                    {state.isComplete ? <PartyPopper size={15} /> : <Sparkles size={15} />}
                  </span>
                  <h2 className="font-semibold">
                    {state.isComplete ? t("doneTitle") : t("title")}
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  {state.isComplete ? t("doneSubtitle") : t("subtitle")}
                </p>
              </div>

              <button
                onClick={dismiss}
                aria-label={t("dismiss")}
                className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground tabular-nums shrink-0">
                {t("progress", { done: state.completedCount, total: state.total })}
              </span>
            </div>

            <ul className="flex flex-col gap-0.5">
              {ONBOARDING_STEPS.map((step) => {
                const isDone = state.done[step];
                const isNext = step === firstPending;
                const Icon = STEP_ICON[step];

                const row = (
                  <>
                    <span
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
                        isDone
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground"
                      )}
                    >
                      {isDone ? <Check size={12} strokeWidth={3} /> : <Icon size={11} />}
                    </span>

                    <span
                      className={cn(
                        "flex-1 min-w-0 text-sm",
                        isDone && "text-muted-foreground line-through decoration-muted-foreground/40"
                      )}
                    >
                      {t(`steps.${step}.label`)}
                    </span>

                    {!isDone && (
                      <span className="hidden shrink-0 items-center gap-1 text-xs text-muted-foreground sm:flex">
                        {t(`steps.${step}.action`)}
                        <ArrowRight size={12} />
                      </span>
                    )}
                  </>
                );

                if (isDone) {
                  return (
                    <li
                      key={step}
                      className="flex items-center gap-3 rounded-lg px-2 py-2"
                    >
                      {row}
                    </li>
                  );
                }

                return (
                  <li key={step}>
                    <Link
                      href={guideHref(step, firstBoardId)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted",
                        isNext && "bg-muted/60"
                      )}
                    >
                      {row}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
