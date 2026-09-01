"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { KikiLogo } from "@/components/Shared/KikiLogo/KikiLogo";

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
        Kiki
      </Link>
      <p className="sm:absolute sm:left-1/2 sm:-translate-x-1/2">
        © {new Date().getFullYear()} Kiki. {tHome("footerRights")}
      </p>
      <div className="flex items-center gap-4">
        <Link
          href="/privacy"
          className="hover:text-foreground transition-colors"
        >
          {tHome("footerPrivacy")}
        </Link>
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
