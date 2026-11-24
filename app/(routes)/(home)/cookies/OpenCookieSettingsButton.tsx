"use client";

import { SlidersHorizontal } from "lucide-react";
import { openCookiePreferences } from "@/lib/cookieConsent";

export function OpenCookieSettingsButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={openCookiePreferences}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
    >
      <SlidersHorizontal size={13} />
      {label}
    </button>
  );
}
