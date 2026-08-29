"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Globe, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { locales, localeDetails, isLocale, type Locale } from "@/i18n/routing";
import { setLocale } from "@/actions/locale";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const localeFromHook = useLocale();
  const currentLocale: Locale = isLocale(localeFromHook) ? localeFromHook : "en";
  const t = useTranslations("common");
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === currentLocale || isPending) return;

    setIsPending(true);
    void setLocale(newLocale)
      .then(() => {
        router.refresh();
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  const activeDetails = localeDetails[currentLocale] || localeDetails.en;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isPending}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 h-8 text-xs font-medium rounded-lg border border-border/40 bg-background/60 hover:bg-accent/60 transition-colors cursor-pointer select-none outline-none disabled:opacity-50",
          className
        )}
        aria-label={t("selectLanguage")}
      >
        <Globe className="size-3.5 text-muted-foreground" />
        <span className="text-sm leading-none">{activeDetails.flag}</span>
        <span className="font-semibold text-xs tracking-wider">{activeDetails.shortCode}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 min-w-36 p-1">
        {locales.map((loc) => {
          const detail = localeDetails[loc];
          const isSelected = loc === currentLocale;

          return (
            <DropdownMenuItem
              key={loc}
              onClick={() => handleLocaleChange(loc)}
              className={cn(
                "flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md cursor-pointer",
                isSelected && "font-semibold bg-accent/50 text-accent-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm leading-none">{detail.flag}</span>
                <span>{detail.label}</span>
              </div>
              {isSelected && <Check className="size-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
