"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { cn } from "@/lib/utils";
import { TextAnimate } from "@/components/ui/text-animate";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";

export function Hero() {
  const t = useTranslations("home");

  return (
    <section className="flex flex-col items-center justify-center text-center px-4 pt-40 pb-24 gap-6">
      <AnimatedGradientText className="text-sm">
        <span className="mr-1">✨</span>
        <hr className="mx-2 h-4 w-px shrink-0 bg-transparent" />
        <span
          className={cn(
            "inline animate-gradient bg-gradient-to-r from-[#ffaa40] via-[#9c40ff] to-[#ffaa40] bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent"
          )}
        >
          {t("heroBadge")}
        </span>
        <ChevronRight className="ml-1 size-3" />
      </AnimatedGradientText>

      <TextAnimate
        animation="blurInUp"
        className="text-4xl sm:text-6xl font-bold tracking-tight max-w-3xl"
        once
      >
        {t("heroTitle1")}
      </TextAnimate>
      <TextAnimate
        animation="slideLeft"
        className="text-4xl sm:text-6xl font-bold tracking-tight max-w-3xl leading-tight"
      >
        {t("heroTitle2")}
      </TextAnimate>

      <p className="text-lg text-muted-foreground max-w-xl">
        {t("heroDescription")}
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link href="/sign-in">
          <InteractiveHoverButton>{t("heroCta")}</InteractiveHoverButton>
        </Link>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("heroSubtext")}
      </p>
    </section>
  );
}
