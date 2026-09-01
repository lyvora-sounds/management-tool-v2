"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { StepProps } from "../CreateBoardStepper.types";

export function StepInitialLists({ data, onChange }: StepProps) {
  const t = useTranslations("boards");

  const updateList = (index: number, value: string) => {
    const next = [...data.lists];
    next[index] = value;
    onChange({ lists: next });
  };

  const removeList = (index: number) => {
    onChange({ lists: data.lists.filter((_, i) => i !== index) });
  };

  const addList = () => {
    onChange({ lists: [...data.lists, ""] });
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {t("listsHint")}
      </p>
      <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
        {data.lists.map((list, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input
              value={list}
              onChange={(e) => updateList(i, e.target.value)}
              placeholder={t("listPlaceholder", { n: i + 1 })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeList(i)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addList}
        className="self-start"
      >
        <Plus className="mr-1 h-4 w-4" />
        {t("addList")}
      </Button>
    </div>
  );
}
