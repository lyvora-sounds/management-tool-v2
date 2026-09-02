import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Check } from "lucide-react";
import { HomeNavbar } from "@/components/Shared/HomeNavbar/HomeNavbar";
import { HomeFooter } from "@/components/Shared/HomeFooter/HomeFooter";
import { Reveal } from "@/components/Shared/Reveal/Reveal";
import { Highlighter } from "@/components/ui/highlighter";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { cn } from "@/lib/utils";
import { FLOW } from "./data";
import { FlowVisual } from "./components/FlowVisual";
import { FaqList } from "./components/FaqList";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("howItWorks");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function HowItWorksPage() {
  const t = await getTranslations("howItWorks");

  return (
    <div className="min-h-screen flex flex-col">
      <HomeNavbar />

      <main className="flex flex-col flex-1 pt-16">
        {/* Hero */}
        <div className="px-4 sm:px-8 pt-20 pb-14 text-center max-w-3xl mx-auto">
          <Reveal position="bottom">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">
              {t("kicker")}
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-5">
              {t("title")}
            </h1>
          </Reveal>

          {/* Fuera del Reveal a propósito: ver la nota en /functions. */}
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {t.rich("subtitle", {
              underline: (chunks) => (
                <Highlighter action="underline" color="#FF9800">
                  {chunks}
                </Highlighter>
              ),
            })}
          </p>
        </div>

        {/* Recorrido: pasos alternando lado en escritorio, apilados en móvil */}
        <section className="px-4 sm:px-8 pb-8 max-w-5xl mx-auto w-full">
          <ol className="flex flex-col gap-16 sm:gap-24">
            {FLOW.map((step, i) => {
              const isEven = i % 2 === 0;
              return (
                <li key={step.key}>
                  <Reveal position="bottom">
                    <div className="grid items-center gap-8 sm:grid-cols-2">
                      {/* Texto */}
                      <div className={cn("flex flex-col gap-4", !isEven && "sm:order-2")}>
                        <div className="flex items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                            <step.Icon size={17} />
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            {t("stepLabel", { number: i + 1, total: FLOW.length })}
                          </span>
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
                          {t(step.title)}
                        </h2>

                        <p className="text-muted-foreground leading-relaxed">
                          {t(step.body)}
                        </p>

                        <ul className="flex flex-col gap-2">
                          {step.bullets.map((bullet) => (
                            <li key={bullet} className="flex items-start gap-2.5 text-sm">
                              <Check size={15} className="mt-0.5 shrink-0 text-primary" />
                              <span className="text-muted-foreground">{t(bullet)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Maqueta */}
                      <div className={cn(!isEven && "sm:order-1")}>
                        <FlowVisual visual={step.visual} />
                      </div>
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </section>

        {/* FAQ */}
        <section className="px-4 sm:px-8 py-20 max-w-3xl mx-auto w-full">
          <Reveal position="bottom" className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">{t("faqHeading")}</h2>
            <p className="text-muted-foreground">{t("faqSubtitle")}</p>
          </Reveal>

          <Reveal position="bottom">
            <FaqList />
          </Reveal>
        </section>

        {/* Cierre */}
        <section className="px-4 sm:px-8 pb-24">
          <Reveal position="bottom">
            <div className="relative overflow-hidden rounded-3xl border bg-card px-6 py-14 text-center max-w-3xl mx-auto">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-32 left-1/2 size-80 -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/25 to-transparent blur-3xl"
              />
              <div className="relative flex flex-col items-center gap-5">
                <h2 className="text-2xl sm:text-3xl font-bold max-w-lg leading-tight">
                  {t("ctaTitle")}
                </h2>
                <p className="text-muted-foreground max-w-md">{t("ctaBody")}</p>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Link href="/sign-up">
                    <InteractiveHoverButton>{t("ctaButton")}</InteractiveHoverButton>
                  </Link>
                  <Link
                    href="/functions"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t("ctaSecondary")}
                    <ArrowRight size={14} />
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground">{t("ctaFootnote")}</p>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
