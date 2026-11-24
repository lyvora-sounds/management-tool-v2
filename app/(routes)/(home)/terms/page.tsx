import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getLegalTemplateVars } from "@/lib/legalConfig";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("terms");
  const legalVars = getLegalTemplateVars();
  return {
    title: t("metaTitle", legalVars),
    description: t("metaDescription", legalVars),
  };
}

export default async function TermsPage() {
  const t = await getTranslations("terms");
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
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s2Title", legalVars)}</h2>
            <p>{t("s2Body", legalVars)}</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s3Title", legalVars)}</h2>
            <p>{t("s3Body", legalVars)}</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s4Title", legalVars)}</h2>
            <p>{t("s4Body", legalVars)}</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s5Title", legalVars)}</h2>
            <p>{t("s5Body", legalVars)}</p>
            <p>{t("s5PublicShares", legalVars)}</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s6Title", legalVars)}</h2>
            <p>{t("s6CurrentPlan", legalVars)}</p>
            <p>{t("s6FutureSubscriptions", legalVars)}</p>
            <p>{t("s6EuWithdrawal", legalVars)}</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s7Title", legalVars)}</h2>
            <p>{t("s7Body", legalVars)}</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s8Title", legalVars)}</h2>
            <p>{t("s8Body", legalVars)}</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s9Title", legalVars)}</h2>
            <p>{t("s9Body", legalVars)}</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s10Title", legalVars)}</h2>
            <p>{t("s10Body", legalVars)}</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s11Title", legalVars)}</h2>
            <p>{t("s11Primary", legalVars)}</p>
            <p>{t("s11Us", legalVars)}</p>
            <p>{t("s11EuCh", legalVars)}</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s12Title", legalVars)}</h2>
            <p>{t("s12Body", legalVars)}</p>
          </section>

          <div className="pt-4 border-t flex flex-wrap gap-4 text-xs">
            <Link
              href="/privacy"
              className="underline underline-offset-2 hover:text-foreground"
            >
              {t("relatedPrivacy", legalVars)}
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
