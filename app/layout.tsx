import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Outfit, Figtree } from "next/font/google";
import { Toaster } from "sonner";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import "./globals.css";
import { cn } from "@/lib/utils";
import { CookieBanner } from "@/components/CookieBanner";

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});

const outfit = Outfit({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  const locale = await getLocale();
  const title = t("title");
  const description = t("description");

  return {
    title: {
      default: title,
      template: "%s | Kiki",
    },
    description,
    keywords:
      locale === "es"
        ? ["gestión de proyectos", "kanban", "tickets", "colaboración", "equipos", "productividad"]
        : locale === "tl"
          ? ["pamamahala ng proyekto", "kanban", "tickets", "kolaborasyon", "mga team", "produktibidad"]
          : ["project management", "kanban", "tickets", "collaboration", "teams", "productivity"],
    authors: [{ name: "Kiki" }],
    creator: "Kiki",
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://kikiboard.xyz"),
    openGraph: {
      title,
      description: t("ogDescription"),
      url: "https://kikiboard.xyz",
      siteName: "Kiki",
      locale: locale === "es" ? "es_ES" : locale === "tl" ? "fil_PH" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: t("ogDescription"),
    },
    icons: {
      icon: "/kikilogo.ico",
      shortcut: "/kikilogo.ico",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={cn("font-sans", figtree.variable)}>
      <body className={outfit.className}>
        <ClerkProvider>
          <NextIntlClientProvider key={locale} locale={locale} messages={messages}>
            {children}
            <Toaster richColors closeButton position="bottom-right" />
            <CookieBanner />
          </NextIntlClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

