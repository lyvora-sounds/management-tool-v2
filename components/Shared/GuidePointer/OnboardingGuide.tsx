"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { GuidePointer } from "./GuidePointer";
import { GUIDE_TARGETS, isGuidedStep } from "./guides";

/**
 * Traduce `?guide=<paso>` en un señalador sobre el control que toca.
 *
 * Vive en el layout del dashboard, así que sirve a cualquier ruta de dentro:
 * el checklist enlaza a la página correcta con el parámetro puesto y aquí se
 * resuelve, sin que cada página tenga que saber nada del onboarding.
 */
export function OnboardingGuide() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("guide");

  const step = params.get("guide");
  // Como cadena y no como objeto: el compilador de React no sabe razonar sobre
  // ReadonlyURLSearchParams y se le cae la memoización del callback.
  const search = params.toString();

  const dismiss = useCallback(() => {
    // Se quita el parámetro para que recargar o compartir la URL no reabra la
    // ayuda. replace y no push: no merece una entrada en el historial.
    const next = new URLSearchParams(search);
    next.delete("guide");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [search, pathname, router]);

  if (!isGuidedStep(step)) return null;

  return (
    <GuidePointer
      key={step}
      target={GUIDE_TARGETS[step]}
      title={t(`${step}.title`)}
      body={t(`${step}.body`)}
      cta={t("gotIt")}
      onDismiss={dismiss}
    />
  );
}
