"use client";

import { useTranslations } from "next-intl";
import { NumberTicker } from "@/components/ui/number-ticker";
import { stats } from "./StatsSection.data";
import { Reveal } from "@/components/Shared/Reveal/Reveal";

export function StatsSection() {
  const t = useTranslations("home");

  return (
    <Reveal position="bottom" className="border-y bg-muted/30 py-20">
      <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
        {stats.map(({ value, suffix, label }) => (
          <div key={label} className="flex flex-col gap-1">
            <div className="text-4xl font-bold flex items-end justify-center gap-0.5">
              <NumberTicker value={value} />
              <span>{suffix}</span>
            </div>
            <p className="text-sm text-muted-foreground">{t(label)}</p>
          </div>
        ))}
      </div>
    </Reveal>
  );
}
