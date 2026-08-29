"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { GreetingProps } from "./Greeting.types";

function greetingKey(hour: number) {
  if (hour >= 6 && hour < 13) return "greetingMorning" as const;
  if (hour >= 13 && hour < 20) return "greetingAfternoon" as const;
  return "greetingEvening" as const;
}

export function Greeting({ name }: GreetingProps) {
  const t = useTranslations("dashboard");
  const [key, setKey] = useState<
    "greetingMorning" | "greetingAfternoon" | "greetingEvening" | null
  >(null);
  const displayName = name?.split(" ")[0] ?? t("greetingFallbackName");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setKey(greetingKey(new Date().getHours()));
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  const greeting = key ? t(key) : t("greetingHello");

  return (
    <div className="flex flex-col gap-0.5">
      <h1 className="text-2xl font-bold">
        {greeting}, {displayName} 👋
      </h1>
      <p className="text-sm text-muted-foreground">
        {t("greetingSubtitle")}
      </p>
    </div>
  );
}
