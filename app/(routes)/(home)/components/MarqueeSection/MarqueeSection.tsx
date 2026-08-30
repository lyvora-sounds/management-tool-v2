"use client";

import { useTranslations } from "next-intl";
import { Marquee } from "@/components/ui/marquee";
import { features } from "./MarqueeSection.data";
import { Reveal } from "@/components/Shared/Reveal/Reveal";

function FeatureChip({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-sm whitespace-nowrap">
      <span className="text-primary">{icon}</span>
      {label}
    </div>
  );
}

export function MarqueeSection() {
  const t = useTranslations("home");

  return (
    <Reveal position="bottom" className="relative overflow-hidden py-8">
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      <Marquee pauseOnHover className="[--duration:30s]">
        {features.map((f) => (
          <FeatureChip key={f.label} icon={f.icon} label={t(f.label)} />
        ))}
      </Marquee>
    </Reveal>
  );
}
