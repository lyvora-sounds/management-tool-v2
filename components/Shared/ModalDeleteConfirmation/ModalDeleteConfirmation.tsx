"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { ConfirmModalProps } from "./ModalDeleteConfirmation.types";

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "destructive",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const t = useTranslations("common");
  const resolvedConfirm = confirmLabel ?? t("confirm");
  const resolvedCancel = cancelLabel ?? t("cancel");
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) confirmRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open || typeof document === "undefined") return null;

  const isDestructive = variant === "destructive";

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-sm mx-4 bg-background rounded-xl border border-border shadow-xl p-6 flex flex-col gap-4">
        {/* Close */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={16} />
        </button>

        {/* Icon + title */}
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 shrink-0 p-2 rounded-full ${
              isDestructive
                ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                : "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
            }`}
          >
            <AlertTriangle size={16} />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold text-foreground text-base">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors disabled:opacity-50"
          >
            {resolvedCancel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm rounded-lg font-medium text-white transition-colors disabled:opacity-50 ${
              isDestructive
                ? "bg-red-600 hover:bg-red-700 active:bg-red-800"
                : "bg-amber-500 hover:bg-amber-600 active:bg-amber-700"
            }`}
          >
            {loading ? t("processing") : resolvedConfirm}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
