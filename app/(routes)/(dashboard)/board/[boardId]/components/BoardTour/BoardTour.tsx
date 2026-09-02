"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { SpotlightTour, type TourStep } from "@/components/Shared/SpotlightTour";

/** Orden del recorrido: de lo que ya se ve a lo que hay que descubrir. */
const TARGETS = [
  "board-lists",
  "create-task",
  "view-toggle",
  "board-filters",
  "board-ai",
  "board-members",
] as const;

export function BoardTour({ tourSeen }: { tourSeen: boolean }) {
  const t = useTranslations("tour");
  const [open, setOpen] = useState(false);

  // Se abre tras montar y no en el primer render: los elementos señalados son
  // clientes que aún no existen durante la hidratación, y medirlos antes
  // dejaría fuera media mitad del recorrido.
  useEffect(() => {
    if (tourSeen) return;
    const id = window.setTimeout(() => setOpen(true), 600);
    return () => window.clearTimeout(id);
  }, [tourSeen]);

  const finish = () => {
    setOpen(false);
    fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tourSeen: true }),
    }).catch(() => {
      // Si no se puede marcar, el tour reaparecerá en la próxima visita. Es
      // molesto pero inofensivo, y no hay nada útil que decirle al usuario.
    });
  };

  const steps: TourStep[] = TARGETS.map((target) => ({
    target,
    title: t(`steps.${target}.title`),
    body: t(`steps.${target}.body`),
  }));

  return (
    <SpotlightTour
      steps={steps}
      open={open}
      onFinish={finish}
      labels={{
        next: t("next"),
        back: t("back"),
        skip: t("skip"),
        finish: t("finish"),
        counter: (current, total) => t("counter", { current, total }),
      }}
    />
  );
}
