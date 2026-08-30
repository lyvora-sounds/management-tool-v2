import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { KikiLogo } from "@/components/Shared/KikiLogo/KikiLogo";
import { LanguageSwitcher } from "@/components/Shared/LanguageSwitcher";

export async function HomeNavbar() {
  const { userId } = await auth();
  const isSignedIn = !!userId;
  const t = await getTranslations("nav");

  return (
    <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 sm:px-8 h-16 border-b bg-background/80 backdrop-blur-sm">
      <Link href="/" className="flex items-center gap-2 font-bold text-lg">
        <KikiLogo size={20} />
        Kiki
      </Link>

      <nav className="hidden sm:flex absolute left-1/2 -translate-x-1/2 items-center gap-6 text-sm text-muted-foreground">
        <Link
          href="/functions"
          className="hover:text-foreground transition-colors"
        >
          {t("functions")}
        </Link>
        <Link href="/stats" className="hover:text-foreground transition-colors">
          {t("stats")}
        </Link>
      </nav>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        {isSignedIn ? (
          <Link href="/dashboard">
            <InteractiveHoverButton>{t("goToDashboard")}</InteractiveHoverButton>
          </Link>
        ) : (
          <>
            <Link href="/sign-in">
              <InteractiveHoverButton>{t("signIn")}</InteractiveHoverButton>
            </Link>
            <Link href="/sign-up">
              <InteractiveHoverButton>{t("signUp")}</InteractiveHoverButton>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

