"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { Reveal } from "@/components/Shared/Reveal/Reveal";

export function CTASection() {
  const t = useTranslations("home");

  return (
    <Reveal position="right" className="px-4 py-28 flex flex-col items-center text-center gap-6">
      <h2 className="text-3xl sm:text-5xl font-bold max-w-2xl leading-tight">
        {t("ctaHeading")}{" "}
        <span className="text-primary">{t("ctaToday")}</span>
      </h2>
      <p className="text-muted-foreground text-lg max-w-md">
        {t("ctaSubtitle")}
      </p>
      <Link href="/sign-in">
        <InteractiveHoverButton>{t("ctaButton")}</InteractiveHoverButton>
      </Link>
    </Reveal>
  );
}
