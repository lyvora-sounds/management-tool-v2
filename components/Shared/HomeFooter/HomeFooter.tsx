"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { KikiLogo } from "@/components/Shared/KikiLogo/KikiLogo";
import { openCookiePreferences } from "@/lib/cookieConsent";
import { LEGAL_CONFIG } from "@/lib/legalConfig";

export function HomeFooter() {
  const tNav = useTranslations("nav");
  const tHome = useTranslations("home");

  return (
    <footer className="relative border-t px-4 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
      <Link
        href="/"
        className="flex items-center gap-2 font-semibold text-foreground"
      >
        <KikiLogo size={16} />
        {LEGAL_CONFIG.platformName}
      </Link>
      <p className="lg:absolute lg:left-1/2 lg:-translate-x-1/2">
        © {new Date().getFullYear()} {LEGAL_CONFIG.platformName}. {tHome("footerRights")}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/terms"
          className="hover:text-foreground transition-colors"
        >
          {tHome("footerTerms")}
        </Link>
        <Link
          href="/privacy"
          className="hover:text-foreground transition-colors"
        >
          {tHome("footerPrivacy")}
        </Link>
        <Link
          href="/cookies"
          className="hover:text-foreground transition-colors"
        >
          {tHome("footerCookies")}
        </Link>
        <button
          type="button"
          onClick={openCookiePreferences}
          className="hover:text-foreground transition-colors cursor-pointer"
        >
          {tHome("footerCookieSettings")}
        </button>
        <Link
          href="/sign-in"
          className="hover:text-foreground transition-colors"
        >
          {tNav("signIn")}
        </Link>
        <Link
          href="/sign-up"
          className="hover:text-foreground transition-colors"
        >
          {tNav("signUp")}
        </Link>
      </div>
    </footer>
  );
}
