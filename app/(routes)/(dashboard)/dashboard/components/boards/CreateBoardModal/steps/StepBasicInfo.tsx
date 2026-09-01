"use client";

import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";
import { StepProps } from "../CreateBoardStepper.types";

export function StepBasicInfo({ data, onChange }: StepProps) {
  const t = useTranslations("boards");
  const tCommon = useTranslations("common");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">
          {t("name")} <span className="text-destructive">*</span>
        </label>
        <Input
          placeholder={t("namePlaceholder")}
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          autoFocus
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-muted-foreground">
          {t("description")} <span className="text-xs">({tCommon("optional")})</span>
        </label>
        <Input
          placeholder={t("descriptionPlaceholder")}
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>
    </div>
  );
}
