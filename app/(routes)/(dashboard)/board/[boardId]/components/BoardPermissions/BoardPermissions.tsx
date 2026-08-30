"use client";

import { useState } from "react";
import { ShieldCheck, X, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface BoardPermissionsProps {
  boardId: string;
  open: boolean;
  onClose: () => void;
  initialMemberCanAssign: boolean;
}

export function BoardPermissions({
  boardId,
  open,
  onClose,
  initialMemberCanAssign,
}: BoardPermissionsProps) {
  const t = useTranslations("permissions");
  const tCommon = useTranslations("common");
  const [memberCanAssign, setMemberCanAssign] = useState(initialMemberCanAssign);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const toggle = async (value: boolean) => {
    setSaving(true);
    const prev = memberCanAssign;
    setMemberCanAssign(value);
    const res = await fetch(`/api/boards/${boardId}/permissions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberCanAssign: value }),
    });
    if (res.ok) {
      toast.success(value ? t("membersCanAssign") : t("ownerOnly"));
    } else {
      setMemberCanAssign(prev);
      toast.error(t("saveError"));
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <ShieldCheck size={17} className="text-muted-foreground" />
            <span className="font-medium text-sm">{t("title")}</span>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <UserCheck size={17} className="text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{t("assignTickets")}</span>
                <span className="text-xs text-muted-foreground">
                  {t("assignHint")}
                </span>
              </div>
            </div>
            <button
              disabled={saving}
              onClick={() => toggle(!memberCanAssign)}
              className={`relative shrink-0 h-5 w-9 rounded-full transition-colors ${
                memberCanAssign ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  memberCanAssign ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="px-5 pb-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            {tCommon("close")}
          </Button>
        </div>
      </div>
    </div>
  );
}
