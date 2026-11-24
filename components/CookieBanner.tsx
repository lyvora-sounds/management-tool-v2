"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { getLegalTemplateVars } from "@/lib/legalConfig";
import {
  COOKIE_PREFERENCES_EVENT,
  buildConsentPreferences,
  clearOptionalFunctionalStorage,
  isGlobalPrivacyControlEnabled,
  readCookieConsent,
  writeCookieConsent,
} from "@/lib/cookieConsent";

export function CookieBanner() {
  const t = useTranslations("cookie");
  const legalVars = getLegalTemplateVars();
  const [bannerVisible, setBannerVisible] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [functionalEnabled, setFunctionalEnabled] = useState(false);
  const [gpcDetected, setGpcDetected] = useState(false);

  useEffect(() => {
    const gpc = isGlobalPrivacyControlEnabled();
    const existing = readCookieConsent();

    const timer = window.setTimeout(() => {
      setGpcDetected(gpc);
      if (existing) {
        setFunctionalEnabled(existing.functional);
        setBannerVisible(false);
      } else if (gpc) {
        // Honor Global Privacy Control (CCPA/CPRA) automatically by defaulting non-essential off.
        const prefs = buildConsentPreferences({ mode: "reject_non_essential" }, true);
        writeCookieConsent(prefs);
        clearOptionalFunctionalStorage();
        setFunctionalEnabled(false);
        setBannerVisible(false);
      } else {
        // EU/CH ePrivacy: no pre-ticked non-essential toggles.
        setFunctionalEnabled(false);
        setBannerVisible(true);
      }
    }, 0);

    const handleOpenPreferences = () => {
      const current = readCookieConsent();
      setFunctionalEnabled(current?.functional ?? false);
      setGpcDetected(isGlobalPrivacyControlEnabled());
      setCustomizeOpen(true);
      setBannerVisible(false);
    };

    window.addEventListener(COOKIE_PREFERENCES_EVENT, handleOpenPreferences);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(COOKIE_PREFERENCES_EVENT, handleOpenPreferences);
    };
  }, []);

  const handleCloseCustomize = () => {
    setCustomizeOpen(false);
    if (!readCookieConsent()) {
      setBannerVisible(true);
    }
  };

  useEffect(() => {
    if (!customizeOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCustomizeOpen(false);
        if (!readCookieConsent()) {
          setBannerVisible(true);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [customizeOpen]);

  const persist = (choice: Parameters<typeof buildConsentPreferences>[0]) => {
    const prefs = buildConsentPreferences(choice, gpcDetected);
    writeCookieConsent(prefs);
    if (!prefs.functional) {
      clearOptionalFunctionalStorage();
    }
    setFunctionalEnabled(prefs.functional);
    setBannerVisible(false);
    setCustomizeOpen(false);
  };

  if (!bannerVisible && !customizeOpen) return null;

  return (
    <>
      {bannerVisible && (
        <div
          role="dialog"
          aria-label={t("bannerAriaLabel", legalVars)}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl"
        >
          <div className="rounded-xl border bg-card shadow-lg px-4 py-3.5 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <Cookie size={18} className="text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground flex-1 leading-relaxed">
                {t("body", legalVars)}{" "}
                <Link
                  href="/cookies"
                  className="underline underline-offset-2 text-foreground/90 hover:text-foreground transition-colors"
                >
                  {t("cookiesLink", legalVars)}
                </Link>{" "}
                ·{" "}
                <Link
                  href="/privacy"
                  className="underline underline-offset-2 text-foreground/90 hover:text-foreground transition-colors"
                >
                  {t("privacy", legalVars)}
                </Link>
                .
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCustomizeOpen(true);
                  setBannerVisible(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <SlidersHorizontal size={13} />
                {t("customize", legalVars)}
              </button>
              <button
                type="button"
                onClick={() => persist({ mode: "reject_non_essential" })}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                {t("reject", legalVars)}
              </button>
              <button
                type="button"
                onClick={() => persist({ mode: "accept_all" })}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
              >
                {t("accept", legalVars)}
              </button>
            </div>
          </div>
        </div>
      )}

      {customizeOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-prefs-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-lg rounded-xl border bg-card shadow-xl p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="cookie-prefs-title" className="text-base font-semibold text-foreground">
                  {t("modalTitle", legalVars)}
                </h2>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {t("modalDescription", legalVars)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseCustomize}
                aria-label={t("close", legalVars)}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {gpcDetected && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
                <ShieldCheck size={15} className="shrink-0" />
                <span>{t("gpcHonored", legalVars)}</span>
              </div>
            )}

            <div className="flex flex-col gap-3 text-sm">
              <div className="rounded-lg border p-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{t("necessaryTitle", legalVars)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {t("necessaryDesc", legalVars)}
                  </p>
                </div>
                <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {t("alwaysActive", legalVars)}
                </span>
              </div>

              <label className="rounded-lg border p-3 flex items-start justify-between gap-3 cursor-pointer">
                <div>
                  <p className="font-medium text-foreground">{t("functionalTitle", legalVars)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {t("functionalDesc", legalVars)}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={functionalEnabled}
                  onChange={(e) => setFunctionalEnabled(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-primary cursor-pointer"
                />
              </label>

              <div className="rounded-lg border p-3 flex items-start justify-between gap-3 opacity-80">
                <div>
                  <p className="font-medium text-foreground">{t("analyticsTitle", legalVars)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {t("analyticsDesc", legalVars)}
                  </p>
                </div>
                <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {t("notUsed", legalVars)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
              <Link
                href="/cookies"
                onClick={handleCloseCustomize}
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                {t("cookiesLink", legalVars)}
              </Link>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => persist({ mode: "reject_non_essential" })}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  {t("reject", legalVars)}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    persist({ mode: "custom", functional: functionalEnabled })
                  }
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  {t("savePreferences", legalVars)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
