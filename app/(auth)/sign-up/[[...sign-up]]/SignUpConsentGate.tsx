"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { getLegalTemplateVars } from "@/lib/legalConfig";
import {
  buildPendingSignUpConsent,
  isSignUpSubRoute,
  savePendingSignUpConsent,
  validateSignUpConsents,
} from "@/lib/cookieConsent";

interface SignUpConsentGateProps {
  children: ReactNode;
}

/**
 * Enforces separate, unbundled, unchecked-by-default legal consents before
 * displaying the Clerk SignUp widget (GDPR Art. 7, Swiss nLPD, US CAN-SPAM).
 */
export function SignUpConsentGate({ children }: SignUpConsentGateProps) {
  const pathname = usePathname();
  const t = useTranslations("signUpConsent");
  const legalVars = getLegalTemplateVars();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingEmailAccepted, setMarketingEmailAccepted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [attempted, setAttempted] = useState(false);

  // Never block Clerk OAuth callbacks or verification sub-routes (e.g. /sign-up/sso-callback,
  // /sign-up/verify-email-address) where the browser remounts this component after redirect.
  if (isSignUpSubRoute(pathname)) {
    return <div className="w-full max-w-md">{children}</div>;
  }

  const validation = validateSignUpConsents({
    termsAccepted,
    privacyAccepted,
    marketingEmailAccepted,
  });

  if (confirmed) {
    return (
      <div className="w-full max-w-md flex flex-col gap-3">
        {children}
        <button
          type="button"
          onClick={() => setConfirmed(false)}
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground self-start cursor-pointer"
        >
          {t("reviewConsents", legalVars)}
        </button>
      </div>
    );
  }

  const handleContinue = (event: React.FormEvent) => {
    event.preventDefault();
    setAttempted(true);
    if (!validation.valid) return;

    const record = buildPendingSignUpConsent(
      { termsAccepted, privacyAccepted, marketingEmailAccepted },
      {
        termsText: t("termsLabelPlain", legalVars),
        privacyText: t("privacyLabelPlain", legalVars),
        marketingEmailText: t("marketingLabelPlain", legalVars),
      },
    );
    savePendingSignUpConsent(record);
    setConfirmed(true);
  };

  return (
    <form
      onSubmit={handleContinue}
      noValidate
      className="w-full max-w-md flex flex-col gap-5"
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">{t("title", legalVars)}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle", legalVars)}</p>
      </div>

      <div className="flex flex-col gap-3.5 text-sm">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            required
            aria-invalid={attempted && validation.missingTerms}
            className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-primary cursor-pointer"
          />
          <span className="text-foreground leading-relaxed">
            {t.rich("termsLabel", {
              ...legalVars,
              link: (chunks) => (
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 font-medium hover:text-primary"
                >
                  {chunks}
                </Link>
              ),
            })}{" "}
            <span className="text-destructive">*</span>
          </span>
        </label>
        {attempted && validation.missingTerms && (
          <p role="alert" className="text-xs text-destructive -mt-2 pl-6">
            {t("termsRequiredError", legalVars)}
          </p>
        )}

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={privacyAccepted}
            onChange={(e) => setPrivacyAccepted(e.target.checked)}
            required
            aria-invalid={attempted && validation.missingPrivacy}
            className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-primary cursor-pointer"
          />
          <span className="text-foreground leading-relaxed">
            {t.rich("privacyLabel", {
              ...legalVars,
              link: (chunks) => (
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 font-medium hover:text-primary"
                >
                  {chunks}
                </Link>
              ),
            })}{" "}
            <span className="text-destructive">*</span>
          </span>
        </label>
        {attempted && validation.missingPrivacy && (
          <p role="alert" className="text-xs text-destructive -mt-2 pl-6">
            {t("privacyRequiredError", legalVars)}
          </p>
        )}

        <label className="flex items-start gap-2.5 cursor-pointer pt-1 border-t">
          <input
            type="checkbox"
            checked={marketingEmailAccepted}
            onChange={(e) => setMarketingEmailAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-primary cursor-pointer"
          />
          <span className="text-muted-foreground leading-relaxed">
            {t("marketingLabel", legalVars)}{" "}
            <span className="text-xs">({t("optional", legalVars)})</span>
          </span>
        </label>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed bg-muted/50 rounded-lg px-3 py-2.5">
        {t("loggingDisclosure", legalVars)}
      </p>

      <button
        type="submit"
        className="w-full rounded-lg bg-zinc-900 hover:bg-zinc-800 active:bg-black text-white font-medium py-2.5 text-sm transition-colors cursor-pointer"
      >
        {t("continueButton", legalVars)}
      </button>

      <p className="text-xs text-muted-foreground text-center">
        {t("alreadyHaveAccount", legalVars)}{" "}
        <Link
          href="/sign-in"
          className="text-foreground font-medium underline underline-offset-2"
        >
          {t("signInLink", legalVars)}
        </Link>
      </p>
    </form>
  );
}
