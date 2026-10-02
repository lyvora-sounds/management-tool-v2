"use client";

import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { StepProps } from "../CreateBoardStepper.types";

export function StepBasicInfo({ data, onChange }: StepProps) {
  const t = useTranslations("boards");
  const tCommon = useTranslations("common");
  const [organizations, setOrganizations] = useState<{ id: string; name: string; role: string }[]>([]);

  useEffect(() => {
    fetch("/api/organizations")
      .then((response) => response.ok ? response.json() : [])
      .then((items) => {
        const manageable = items.filter((item: { role: string }) => item.role === "owner" || item.role === "admin");
        setOrganizations(manageable);
        if (!data.organizationId && manageable[0]) onChange({ organizationId: manageable[0].id });
      });
  }, [data.organizationId, onChange]);

  return (
    <div className="flex flex-col gap-4">
      {organizations.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">{t("organization")}</label>
          <select className="h-9 rounded-md border bg-background px-3 text-sm" value={data.organizationId} onChange={(event) => onChange({ organizationId: event.target.value })}>
            {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
          </select>
        </div>
      )}
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
