"use client";

import { useEffect, useState } from "react";
import {
  Share2,
  Copy,
  Check,
  Globe,
  Trash2,
  Loader2,
  ExternalLink,
  Lock,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { copyToClipboard } from "@/lib/copyText";
import { privateTicketUrl } from "@/lib/ticketShare";

function InfoHint({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-expanded={open}
        aria-label={text}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Info size={13} aria-hidden />
      </button>
      <span
        role="tooltip"
        hidden={!open}
        className="absolute top-full left-0 z-20 mt-1 w-60 rounded-md bg-foreground px-2.5 py-1.5 text-left text-xs leading-relaxed font-normal text-background shadow-md"
      >
        {text}
      </span>
    </span>
  );
}

interface TaskShareModalProps {
  boardId: string;
  taskId: string;
  taskTitle: string;
  open: boolean;
  onClose: () => void;
}

export function TaskShareModal({
  boardId,
  taskId,
  taskTitle,
  open,
  onClose,
}: TaskShareModalProps) {
  const t = useTranslations("task");
  const tCommon = useTranslations("common");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [privateUrl, setPrivateUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<"private" | "public" | null>(null);

  useEffect(() => {
    setPrivateUrl(privateTicketUrl(window.location.origin, boardId, taskId));
  }, [boardId, taskId]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setShareUrl(null);
    setLoading(true);
    fetch(`/api/tasks/${taskId}/share`)
      .then(async (res) => {
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) setShareUrl(data.shareUrl ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, taskId]);

  const generateLink = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/share`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.shareUrl) {
        setShareUrl(data.shareUrl);
        toast.success(t("shareGenerated"));
      } else {
        toast.error(data.error || t("shareError"));
      }
    } catch {
      toast.error(tCommon("connectionError"));
    } finally {
      setLoading(false);
    }
  };

  const revokeLink = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/share`, { method: "DELETE" });
      if (res.ok) {
        setShareUrl(null);
        toast.success(t("shareRevoked"));
      } else {
        toast.error(t("revokeError"));
      }
    } catch {
      toast.error(tCommon("connectionError"));
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async (kind: "private" | "public", value: string) => {
    if (!value) return;
    if (await copyToClipboard(value)) {
      setCopied(kind);
      toast.success(t("shareCopied"));
      setTimeout(() => setCopied((current) => (current === kind ? null : current)), 2000);
    } else {
      toast.error(tCommon("connectionError"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="gap-4 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Share2 size={18} className="text-primary" />
            <span>{t("shareTitle")}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-sm font-medium">
              <Lock size={14} className="text-muted-foreground" />
              <span>{t("privateLink")}</span>
              <InfoHint text={t("privateLinkHint")} />
            </div>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={privateUrl}
                className="text-xs font-mono bg-muted/50 select-all"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => copyLink("private", privateUrl)}
                disabled={!privateUrl}
                className="shrink-0 h-9 w-9"
                title={t("copyLink")}
              >
                {copied === "private" ? (
                  <Check size={14} className="text-emerald-500" />
                ) : (
                  <Copy size={14} />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5 border-t pt-3">
            <div className="flex items-center gap-1 text-sm font-medium">
              <Globe size={14} className="text-muted-foreground" />
              <span>{t("publicLink")}</span>
              <InfoHint
                text={
                  shareUrl
                    ? t("shareDescription", { title: taskTitle })
                    : `${t("publicLinkEmpty")} ${t("shareDescription", { title: taskTitle })}`
                }
              />
              {loading && <Loader2 className="animate-spin text-muted-foreground" size={14} />}
              {shareUrl && !loading && (
                <span className="ml-auto text-xs font-medium text-emerald-600">{t("linkActive")}</span>
              )}
            </div>

            {loading ? null : shareUrl ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={shareUrl}
                    className="text-xs font-mono bg-muted/50 select-all"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyLink("public", shareUrl)}
                    className="shrink-0 h-9 w-9"
                    title={t("copyLink")}
                  >
                    {copied === "public" ? (
                      <Check size={14} className="text-emerald-500" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </Button>
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={t("openNewTab")}
                    className={buttonVariants({
                      size: "icon",
                      variant: "ghost",
                      className: "shrink-0 h-9 w-9",
                    })}
                  >
                    <ExternalLink size={14} />
                  </a>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={revokeLink}
                    aria-label={t("revokeLink")}
                    title={t("revokeLink")}
                    className="h-9 w-9 shrink-0 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={generateLink} size="sm" className="gap-1.5">
                <Share2 size={14} />
                <span>{t("generatePublicLink")}</span>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
