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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Share2 size={18} className="text-primary" />
            <span>{t("shareTitle")}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Lock size={14} className="text-muted-foreground" />
              <span>{t("privateLink")}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t("privateLinkHint")}</p>
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

          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Globe size={14} className="text-muted-foreground" />
              <span>{t("publicLink")}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("shareDescription", { title: taskTitle })}
            </p>

            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="animate-spin text-muted-foreground" size={20} />
              </div>
            ) : shareUrl ? (
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
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-600 flex items-center gap-1 font-medium">
                    <Globe size={13} />
                    <span>{t("linkActive")}</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={revokeLink}
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 h-7 text-xs gap-1"
                  >
                    <Trash2 size={12} />
                    <span>{t("revokeLink")}</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-3">
                <p className="text-xs text-muted-foreground">{t("publicLinkEmpty")}</p>
                <Button onClick={generateLink} size="sm" className="gap-1.5">
                  <Share2 size={14} />
                  <span>{t("generatePublicLink")}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
