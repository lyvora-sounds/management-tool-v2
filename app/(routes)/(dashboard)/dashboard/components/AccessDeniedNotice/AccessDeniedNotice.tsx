"use client";

import { ShieldAlert, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function AccessDeniedNotice() {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const router = useRouter();

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3"
    >
      <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{t("noAccessTitle")}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{t("noAccessHint")}</p>
      </div>
      <button
        type="button"
        onClick={() => router.replace("/dashboard")}
        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={tCommon("close")}
      >
        <X size={14} />
      </button>
    </div>
  );
}
