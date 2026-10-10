import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Outfit, Figtree } from "next/font/google";
import { Toaster } from "sonner";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import "./globals.css";
import { cn } from "@/lib/utils";
import { CookieBanner } from "@/components/CookieBanner";
import { APPEARANCE_COOKIE } from "@/lib/appearance";

// Aplica la apariencia guardada antes del primer pintado, solo en las rutas de
// la app. Las páginas públicas no se tocan. El Provider toma el relevo al montar.
const APPEARANCE_BOOT_SCRIPT = `(function(){try{
if(!/^\\/(dashboard|board)(\\/|$)/.test(location.pathname))return;
var m=document.cookie.match(/(?:^|; )${APPEARANCE_COOKIE}=([^;]+)/);if(!m)return;
var a=JSON.parse(decodeURIComponent(m[1])),r=document.documentElement;
var d=a.mode==="dark"||(a.mode==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);
if(d)r.classList.add("dark");
if(a.accent&&a.accent!=="default")r.dataset.accent=a.accent;
if(a.density==="compact")r.dataset.density="compact";
if(a.gradients===false)r.dataset.gradients="off";
if(a.style&&a.style!=="original")r.dataset.style=a.style;
}catch(e){}})();`;

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
    <html
      lang={locale}
      className={cn("font-sans", figtree.variable)}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: APPEARANCE_BOOT_SCRIPT }} />
      </head>
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

