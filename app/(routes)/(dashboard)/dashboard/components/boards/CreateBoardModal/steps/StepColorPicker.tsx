"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { StepProps, PRESET_COLORS } from "../CreateBoardStepper.types";

export function StepColorPicker({ data, onChange }: StepProps) {
  const t = useTranslations("boards");

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {t("colorHint")}
      </p>
      <div className="grid grid-cols-4 gap-3">
        {PRESET_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            title={c.label}
            onClick={() => onChange({ color: data.color === c.value ? "" : c.value })}
            className={cn(
              "h-12 w-full rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring",
              data.color === c.value && "ring-2 ring-offset-2 ring-foreground"
            )}
            style={{ backgroundColor: c.value }}
          />
        ))}
      </div>
      {data.color && (
        <button
          type="button"
          onClick={() => onChange({ color: "" })}
          className="text-xs text-muted-foreground underline underline-offset-2 self-start"
        >
          {t("noColor")}
        </button>
      )}
    </div>
  );
}
