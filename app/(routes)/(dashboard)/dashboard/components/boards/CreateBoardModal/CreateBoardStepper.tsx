"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BoardFormData } from "./CreateBoardStepper.types";
import { StepBasicInfo } from "./steps/StepBasicInfo";
import { StepColorPicker } from "./steps/StepColorPicker";
import { StepInitialLists } from "./steps/StepInitialLists";
import { useBoardsStore } from "@/store/useBoardsStore";

interface CreateBoardStepperProps {
  onSuccess: () => void;
}

export function CreateBoardStepper({ onSuccess }: CreateBoardStepperProps) {
  const t = useTranslations("boards");
  const tCommon = useTranslations("common");
  const defaultLists = () => [t("defaultTodo"), t("defaultDoing"), t("defaultDone")];
  const stepLabels = [t("stepInfo"), t("stepColor"), t("stepLists")];

  const [step, setStep] = useState(0);
  const [data, setData] = useState<BoardFormData>({
    title: "",
    description: "",
    color: "",
    lists: defaultLists(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const addBoard = useBoardsStore((s) => s.addBoard);

  const patch = (partial: Partial<BoardFormData>) =>
    setData((prev) => ({ ...prev, ...partial }));

  const canAdvance = step === 0 ? data.title.trim().length > 0 : true;

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/boards/createBoard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description || undefined,
          color: data.color || undefined,
          lists: data.lists.filter((l) => l.trim()),
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error || t("createError"));
        return;
      }

      const board = await res.json();
      addBoard(board);
      setStep(0);
      setData({
        title: "",
        description: "",
        color: "",
        lists: defaultLists(),
      });
      onSuccess();
      router.refresh();
    } catch {
      setError(tCommon("connectionError"));
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    <StepBasicInfo key="basic" data={data} onChange={patch} />,
    <StepColorPicker key="color" data={data} onChange={patch} />,
    <StepInitialLists key="lists" data={data} onChange={patch} />,
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {stepLabels.map((label, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors",
                  i <= step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {i + 1}
              </div>
              <span
                className={cn(
                  "text-xs hidden sm:inline",
                  i === step ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {i < stepLabels.length - 1 && (
              <div
                className={cn(
                  "h-px w-6 mx-1 transition-colors",
                  i < step ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="min-h-[140px]">{steps[step]}</div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0 || loading}
        >
          {tCommon("back")}
        </Button>

        {step < stepLabels.length - 1 ? (
          <Button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance}
          >
            {tCommon("next")}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !data.title.trim()}
          >
            {loading ? tCommon("creating") : tCommon("create")}
          </Button>
        )}
      </div>
    </div>
  );
}
