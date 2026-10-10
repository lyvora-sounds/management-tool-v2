"use client";

import { Check, Monitor, Moon, RotateCcw, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useAppearance } from "@/components/Appearance/AppearanceProvider";
import {
  ACCENTS,
  ACCENT_SWATCH,
  CARD_FIELDS,
  DENSITIES,
  STYLES,
  THEME_MODES,
  type ThemeMode,
} from "@/lib/appearance";

const MODE_ICON: Record<ThemeMode, typeof Sun> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function ChoiceButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
        selected
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:text-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

// Tarjeta de muestra. Usa las mismas variables CSS (--card-px, --primary...)
// que la tarjeta real del tablero, así lo que se ve aquí es lo que se obtiene.
function PreviewCard() {
  const t = useTranslations("settings");
  const { card: show } = useAppearance().appearance;
  const hasFooter = show.dueDate || show.subtasks || show.activity || show.people;

  return (
    <div className="rounded-xl bg-muted p-3">
      <div className="flex flex-col gap-(--card-gap) rounded-lg border bg-background px-(--card-px) py-(--card-py) text-(length:--card-text) shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex-1 leading-snug">{t("appearancePreviewTitle")}</span>
          {show.priority && (
            <span className="shrink-0 rounded bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 dark:text-orange-300">
              {t("appearancePreviewPriority")}
            </span>
          )}
        </div>
        {show.tags && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              Story points: 5
            </span>
          </div>
        )}
        {hasFooter && (
          <div className="flex items-center justify-between gap-2 pt-0.5 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2.5">
              {show.dueDate && <span>12 oct</span>}
              {show.subtasks && <span>2/4</span>}
              {show.activity && <span>3</span>}
            </div>
            {show.people && (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                KB
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function AppearanceSettings() {
  const t = useTranslations("settings");
  const { appearance, update, reset } = useAppearance();

  return (
    <div className="space-y-8">
      <Section title={t("appearanceModeTitle")} description={t("appearanceModeDesc")}>
        <div className="grid grid-cols-3 gap-2 sm:max-w-md">
          {THEME_MODES.map((mode) => {
            const Icon = MODE_ICON[mode];
            return (
              <ChoiceButton
                key={mode}
                selected={appearance.mode === mode}
                onClick={() => update({ mode })}
              >
                <Icon size={15} />
                {t(`appearanceMode_${mode}`)}
              </ChoiceButton>
            );
          })}
        </div>
      </Section>

      <Section title={t("appearanceAccentTitle")} description={t("appearanceAccentDesc")}>
        <div className="flex flex-wrap gap-3">
          {ACCENTS.map((accent) => {
            const selected = appearance.accent === accent;
            return (
              <button
                key={accent}
                type="button"
                onClick={() => update({ accent })}
                aria-pressed={selected}
                title={t(`appearanceAccent_${accent}`)}
                className="group flex flex-col items-center gap-1.5"
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition-shadow",
                    selected ? "ring-2 ring-foreground/70" : "group-hover:ring-2 ring-border",
                  )}
                  style={{ backgroundColor: ACCENT_SWATCH[accent] }}
                >
                  {selected && <Check size={16} className="text-white" />}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {t(`appearanceAccent_${accent}`)}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title={t("appearanceDensityTitle")} description={t("appearanceDensityDesc")}>
        <div className="grid grid-cols-2 gap-2 sm:max-w-md">
          {DENSITIES.map((density) => (
            <ChoiceButton
              key={density}
              selected={appearance.density === density}
              onClick={() => update({ density })}
            >
              {t(`appearanceDensity_${density}`)}
            </ChoiceButton>
          ))}
        </div>
      </Section>

      <Section title={t("appearanceStyleTitle")} description={t("appearanceStyleDesc")}>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {STYLES.map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => update({ style })}
              aria-pressed={appearance.style === style}
              className={cn(
                "flex flex-col items-start gap-0.5 rounded-lg border px-4 py-3 text-left transition-colors",
                appearance.style === style
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted",
              )}
            >
              <span
                className={cn(
                  "flex items-center gap-1.5 text-sm font-medium",
                  appearance.style === style && "text-primary",
                )}
              >
                {t(`appearanceStyle_${style}`)}
                {style === "glass" && (
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-primary">
                    {t("appearanceStyleBeta")}
                  </span>
                )}
              </span>
              <span className="text-xs text-muted-foreground">
                {t(`appearanceStyleHint_${style}`)}
              </span>
            </button>
          ))}
        </div>
      </Section>

      <Section title={t("appearanceEffectsTitle")} description={t("appearanceEffectsDesc")}>
        <div className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3 sm:max-w-md">
          <label htmlFor="appearance-gradients" className="cursor-pointer text-sm">
            {t("appearanceGradients")}
          </label>
          <Switch
            id="appearance-gradients"
            checked={appearance.gradients}
            onCheckedChange={(gradients) => update({ gradients })}
          />
        </div>
      </Section>

      <Section title={t("appearanceCardTitle")} description={t("appearanceCardDesc")}>
        <div className="grid gap-6 md:grid-cols-2">
          <ul className="divide-y rounded-lg border">
            {CARD_FIELDS.map((field) => (
              <li key={field} className="flex items-center justify-between gap-3 px-4 py-3">
                <label
                  htmlFor={`card-field-${field}`}
                  className="cursor-pointer text-sm"
                >
                  {t(`appearanceCard_${field}`)}
                </label>
                <Switch
                  id={`card-field-${field}`}
                  checked={appearance.card[field]}
                  onCheckedChange={(checked) => update({ card: { [field]: checked } })}
                />
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {t("appearancePreview")}
            </p>
            <PreviewCard />
          </div>
        </div>
      </Section>

      <div className="flex items-center justify-between border-t pt-4">
        <p className="text-xs text-muted-foreground">{t("appearanceAutoSaved")}</p>
        <Button type="button" variant="outline" size="sm" onClick={reset}>
          <RotateCcw size={14} />
          {t("appearanceReset")}
        </Button>
      </div>
    </div>
  );
}
