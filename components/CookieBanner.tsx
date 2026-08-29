"use client";

import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { useTranslations } from "next-intl";

export function CookieBanner() {
  const t = useTranslations("cookie");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie_consent")) {
      setTimeout(() => setVisible(true), 0);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl">
      <div className="rounded-xl border bg-card shadow-lg px-4 py-3 flex items-center gap-3">
        <Cookie size={18} className="text-muted-foreground shrink-0" />
        <p className="text-sm text-muted-foreground flex-1">
          {t("body")}{" "}
          <a
            href="/privacy"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            {t("privacy")}
          </a>
          .
        </p>
        <button
          onClick={accept}
          className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {t("accept")}
        </button>
      </div>
    </div>
  );
}
