import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("privacy");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={15} />
          {t("back")}
        </Link>

        <h1 className="text-2xl font-semibold mb-1">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mb-8">
          {t("updated")}
        </p>

        <div className="flex flex-col gap-8 text-sm text-muted-foreground leading-relaxed">

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s1Title")}</h2>
            <p>{t("s1Body")}</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s2Title")}</h2>
            <ul className="list-disc list-inside flex flex-col gap-1">
              <li>
                <span className="text-foreground">{t("s2Account")}</span>{" "}
                {t("s2AccountBody")}
              </li>
              <li>
                <span className="text-foreground">{t("s2Content")}</span>{" "}
                {t("s2ContentBody")}
              </li>
              <li>
                <span className="text-foreground">{t("s2Usage")}</span>{" "}
                {t("s2UsageBody")}
              </li>
            </ul>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s3Title")}</h2>
            <ul className="list-disc list-inside flex flex-col gap-1">
              <li>{t("s3P1")}</li>
              <li>{t("s3P2")}</li>
              <li>{t("s3P3")}</li>
              <li>{t("s3P4")}</li>
            </ul>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s4Title")}</h2>
            <p>{t("s4Intro")}</p>
            <ul className="list-disc list-inside flex flex-col gap-1">
              <li>
                <span className="text-foreground">{t("s4Session")}</span>{" "}
                {t("s4SessionBody")}
              </li>
              <li>
                <span className="text-foreground">{t("s4Prefs")}</span>{" "}
                {t("s4PrefsBody")}
              </li>
            </ul>
            <p>{t("s4NoTrack")}</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s5Title")}</h2>
            <ul className="list-disc list-inside flex flex-col gap-1">
              <li>{t("s5Clerk")}</li>
              <li>{t("s5Neon")}</li>
              <li>{t("s5Vercel")}</li>
            </ul>
            <p>{t("s5Footer")}</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s6Title")}</h2>
            <p>{t("s6Body")}</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s7Title")}</h2>
            <p>{t("s7Body")}</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s8Title")}</h2>
            <p>{t("s8Body")}</p>
          </section>

        </div>
      </div>
    </div>
  );
}
