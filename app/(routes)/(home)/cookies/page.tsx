import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LEGAL_CONFIG, getLegalTemplateVars } from "@/lib/legalConfig";
import { OpenCookieSettingsButton } from "./OpenCookieSettingsButton";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cookiesPolicy");
  const legalVars = getLegalTemplateVars();
  return {
    title: t("metaTitle", legalVars),
    description: t("metaDescription", legalVars),
  };
}

export default async function CookiesPolicyPage() {
  const t = await getTranslations("cookiesPolicy");
  const legalVars = getLegalTemplateVars();

  const rows = [
    {
      name: "__session / __client_uat / __clerk_db_jwt",
      category: t("catNecessary", legalVars),
      provider: "Clerk",
      duration: t("durSession", legalVars),
      purpose: t("purpClerk", legalVars),
    },
    {
      name: "github_setup_result",
      category: t("catNecessary", legalVars),
      provider: LEGAL_CONFIG.platformName,
      duration: t("durOneTime", legalVars),
      purpose: t("purpGithub", legalVars),
    },
    {
      name: "NEXT_LOCALE",
      category: t("catFunctional", legalVars),
      provider: LEGAL_CONFIG.platformName,
      duration: t("dur1Year", legalVars),
      purpose: t("purpLocale", legalVars),
    },
    {
      name: "kiki_appearance",
      category: t("catFunctional", legalVars),
      provider: LEGAL_CONFIG.platformName,
      duration: t("dur1Year", legalVars),
      purpose: t("purpAppearance", legalVars),
    },
    {
      name: "sidebar_state",
      category: t("catFunctional", legalVars),
      provider: LEGAL_CONFIG.platformName,
      duration: t("dur7Days", legalVars),
      purpose: t("purpSidebar", legalVars),
    },
    {
      name: "cookie_consent_v2 (localStorage)",
      category: t("catNecessary", legalVars),
      provider: LEGAL_CONFIG.platformName,
      duration: t("durPersistent", legalVars),
      purpose: t("purpConsent", legalVars),
    },
    {
      name: "kiki_pending_signup_consent (sessionStorage)",
      category: t("catNecessary", legalVars),
      provider: LEGAL_CONFIG.platformName,
      duration: t("durTabSession", legalVars),
      purpose: t("purpPendingConsent", legalVars),
    },
    {
      name: "recent_boards / kiki.hierarchy.open / kiki.comments.open (localStorage)",
      category: t("catFunctional", legalVars),
      provider: LEGAL_CONFIG.platformName,
      duration: t("durPersistent", legalVars),
      purpose: t("purpUiState", legalVars),
    },
    {
      name: "kikiboard-local-first (IndexedDB / Dexie)",
      category: t("catFunctional", legalVars),
      provider: LEGAL_CONFIG.platformName,
      duration: t("durPersistent", legalVars),
      purpose: t("purpIndexedDb", legalVars),
    },
  ];

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

        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold mb-1">{t("title", legalVars)}</h1>
            <p className="text-sm text-muted-foreground">{t("updated", legalVars)}</p>
          </div>
          <OpenCookieSettingsButton label={t("manageButton", legalVars)} />
        </div>

        <div className="flex flex-col gap-8 text-sm text-muted-foreground leading-relaxed">
          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s1Title", legalVars)}</h2>
            <p>{t("s1Body", legalVars)}</p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-medium text-foreground">{t("s2Title", legalVars)}</h2>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-muted/40 text-foreground">
                    <th className="py-2.5 px-3 font-medium">{t("colName", legalVars)}</th>
                    <th className="py-2.5 px-3 font-medium">{t("colCategory", legalVars)}</th>
                    <th className="py-2.5 px-3 font-medium">{t("colProvider", legalVars)}</th>
                    <th className="py-2.5 px-3 font-medium">{t("colDuration", legalVars)}</th>
                    <th className="py-2.5 px-3 font-medium">{t("colPurpose", legalVars)}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((row) => (
                    <tr key={row.name}>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-foreground">
                        {row.name}
                      </td>
                      <td className="py-2.5 px-3">{row.category}</td>
                      <td className="py-2.5 px-3">{row.provider}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{row.duration}</td>
                      <td className="py-2.5 px-3">{row.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s3Title", legalVars)}</h2>
            <p>{t("s3Body", legalVars)}</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">{t("s4Title", legalVars)}</h2>
            <p>{t("s4EuCh", legalVars)}</p>
            <p>{t("s4Us", legalVars)}</p>
          </section>

          <div className="pt-4 border-t flex flex-wrap gap-4 text-xs">
            <Link
              href="/privacy"
              className="underline underline-offset-2 hover:text-foreground"
            >
              {t("relatedPrivacy", legalVars)}
            </Link>
            <Link
              href="/terms"
              className="underline underline-offset-2 hover:text-foreground"
            >
              {t("relatedTerms", legalVars)}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
