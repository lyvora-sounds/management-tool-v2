import { dateLocale, type Locale } from "@/i18n/routing";

type Translate = (key: string, values?: Record<string, string | number | Date>) => string;

export function formatRelativeTime(date: Date | string, t: Translate, locale: string): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return t("relative.justNow");
  if (diffMin < 60) return t("relative.minutesAgo", { count: diffMin });
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return t("relative.hoursAgo", { count: diffH });
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return t("relative.yesterday");
  if (diffD < 7) return t("relative.daysAgo", { count: diffD });
  return new Date(date).toLocaleDateString(dateLocale(locale), {
    day: "numeric",
    month: "short",
  });
}

export function formatDueDate(
  date: Date | string,
  t: Translate,
  locale: string,
): {
  label: string;
  variant: "destructive" | "secondary" | "outline";
  isOverdue: boolean;
  isToday: boolean;
  isSoon: boolean;
} {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(date);
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) {
    return {
      label: t("due.overdueDays", { count: Math.abs(diffDays) }),
      variant: "destructive",
      isOverdue: true,
      isToday: false,
      isSoon: false,
    };
  }
  if (diffDays === 0) {
    return {
      label: t("due.today"),
      variant: "outline",
      isOverdue: false,
      isToday: true,
      isSoon: true,
    };
  }
  if (diffDays === 1) {
    return {
      label: t("due.tomorrow"),
      variant: "secondary",
      isOverdue: false,
      isToday: false,
      isSoon: true,
    };
  }
  if (diffDays <= 7) {
    return {
      label: t("due.inDays", { count: diffDays }),
      variant: "secondary",
      isOverdue: false,
      isToday: false,
      isSoon: true,
    };
  }
  return {
    label: due.toLocaleDateString(dateLocale(locale), {
      day: "numeric",
      month: "short",
    }),
    variant: "secondary",
    isOverdue: false,
    isToday: false,
    isSoon: false,
  };
}

export function localeTag(locale: string): Locale {
  return locale === "es" ? "es" : "en";
}
