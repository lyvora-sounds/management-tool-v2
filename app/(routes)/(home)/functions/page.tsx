import { getTranslations } from "next-intl/server";
import { HomeNavbar } from "@/components/Shared/HomeNavbar/HomeNavbar";
import { HomeFooter } from "@/components/Shared/HomeFooter/HomeFooter";
import { BentoSection } from "../components/BentoSection/BentoSection";
import { CTASection } from "../components/CTASection/CTASection";
import { Reveal } from "@/components/Shared/Reveal/Reveal";
import { details } from "./data";

export default async function FuncionesPage() {
  const t = await getTranslations("functions");

  return (
    <div className="min-h-screen flex flex-col">
      <HomeNavbar />

      <main className="flex flex-col flex-1 pt-16">
        {/* Hero */}
        <Reveal
          position="bottom"
          className="px-4 sm:px-8 py-20 text-center max-w-3xl mx-auto"
        >
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">
            {t("kicker")}
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {t("subtitle")}
          </p>
        </Reveal>

        {/* Bento grid */}
        <BentoSection />

        {/* Feature detail list */}
        <section className="px-4 sm:px-8 py-20 max-w-4xl mx-auto w-full">
          <Reveal position="bottom" className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">{t("detailHeading")}</h2>
            <p className="text-muted-foreground">
              {t("detailSubtitle")}
            </p>
          </Reveal>

          <div className="grid gap-10 sm:grid-cols-2">
            {details.map(({ Icon, title, description, points }) => (
              <Reveal key={title} position="bottom">
                <div className="flex flex-col gap-3 p-6 rounded-xl border bg-card hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Icon size={18} />
                    </span>
                    <h3 className="font-semibold text-base">{t(title)}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(description)}
                  </p>
                  <ul className="mt-1 flex flex-col gap-1.5">
                    {points.map((p) => (
                      <li
                        key={p}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        {t(p)}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <CTASection />
      </main>

      <HomeFooter />
    </div>
  );
}
