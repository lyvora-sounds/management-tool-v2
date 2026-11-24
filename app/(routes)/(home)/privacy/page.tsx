import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getLegalTemplateVars } from "@/lib/legalConfig";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("privacy");
  const legalVars = getLegalTemplateVars();
  return {
    title: t("metaTitle", legalVars),
    description: t("metaDescription", legalVars),
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");
  const legalVars = getLegalTemplateVars();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={15} />
          {t("back", legalVars)}
        </Link>

        <h1 className="text-2xl font-semibold mb-1">{t("title", legalVars)}</h1>
        <p className="text-sm text-muted-foreground mb-8">{t("updated", legalVars)}</p>

        <div className="flex flex-col gap-8 text-sm text-muted-foreground leading-relaxed">
          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s1Title", legalVars)}</h2>
            <p>{t("s1Body", legalVars)}</p>
            <p>{t("s1Jurisdictions", legalVars)}</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s2Title", legalVars)}</h2>
            <ul className="list-disc list-inside flex flex-col gap-1.5">
              <li>
                <span className="text-foreground font-medium">{t("s2Account", legalVars)}</span>{" "}
                {t("s2AccountBody", legalVars)}
              </li>
              <li>
                <span className="text-foreground font-medium">{t("s2Content", legalVars)}</span>{" "}
                {t("s2ContentBody", legalVars)}
              </li>
              <li>
                <span className="text-foreground font-medium">{t("s2Security", legalVars)}</span>{" "}
                {t("s2SecurityBody", legalVars)}
              </li>
              <li>
                <span className="text-foreground font-medium">{t("s2Integrations", legalVars)}</span>{" "}
                {t("s2IntegrationsBody", legalVars)}
              </li>
              <li>
                <span className="text-foreground font-medium">{t("s2Local", legalVars)}</span>{" "}
                {t("s2LocalBody", legalVars)}
              </li>
            </ul>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s3Title", legalVars)}</h2>
            <p>{t("s3Intro", legalVars)}</p>
            <ul className="list-disc list-inside flex flex-col gap-1.5">
              <li>{t("s3P1", legalVars)}</li>
              <li>{t("s3P2", legalVars)}</li>
              <li>{t("s3P3", legalVars)}</li>
              <li>{t("s3P4", legalVars)}</li>
              <li>{t("s3P5", legalVars)}</li>
            </ul>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s4Title", legalVars)}</h2>
            <p>{t("s4Intro", legalVars)}</p>
            <ul className="list-disc list-inside flex flex-col gap-1.5">
              <li>
                <span className="text-foreground font-medium">{t("s4Session", legalVars)}</span>{" "}
                {t("s4SessionBody", legalVars)}
              </li>
              <li>
                <span className="text-foreground font-medium">{t("s4Prefs", legalVars)}</span>{" "}
                {t("s4PrefsBody", legalVars)}
              </li>
            </ul>
            <p>{t("s4NoTrack", legalVars)}</p>
            <p>
              <Link
                href="/cookies"
                className="underline underline-offset-2 text-foreground hover:text-primary"
              >
                {t("s4CookiesLink", legalVars)}
              </Link>
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s5Title", legalVars)}</h2>
            <p>{t("s5Intro", legalVars)}</p>
            <ul className="list-disc list-inside flex flex-col gap-1.5">
              <li>{t("s5Clerk", legalVars)}</li>
              <li>{t("s5Neon", legalVars)}</li>
              <li>{t("s5R2", legalVars)}</li>
              <li>{t("s5Resend", legalVars)}</li>
              <li>{t("s5Hosting", legalVars)}</li>
              <li>{t("s5Optional", legalVars)}</li>
            </ul>
            <p>{t("s5Footer", legalVars)}</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s6Title", legalVars)}</h2>
            <p>{t("s6Body", legalVars)}</p>
            <p>{t("s6AuditNote", legalVars)}</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s7Title", legalVars)}</h2>
            <p>{t("s7Body", legalVars)}</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s8Title", legalVars)}</h2>
            <p>{t("s8Body", legalVars)}</p>
            <p>{t("s8Transfers", legalVars)}</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s9Title", legalVars)}</h2>
            <p>{t("s9Body", legalVars)}</p>
            <ul className="list-disc list-inside flex flex-col gap-1.5">
              <li>{t("s9Categories", legalVars)}</li>
              <li>{t("s9NoSale", legalVars)}</li>
              <li>{t("s9Rights", legalVars)}</li>
              <li>{t("s9Gpc", legalVars)}</li>
              <li>{t("s9NonDiscrimination", legalVars)}</li>
            </ul>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s10Title", legalVars)}</h2>
            <p>{t("s10Body", legalVars)}</p>
          </section>

          <div className="pt-4 border-t flex flex-wrap gap-4 text-xs">
            <Link
              href="/terms"
              className="underline underline-offset-2 hover:text-foreground"
            >
              {t("relatedTerms", legalVars)}
            </Link>
            <Link
              href="/cookies"
              className="underline underline-offset-2 hover:text-foreground"
            >
              {t("relatedCookies", legalVars)}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
