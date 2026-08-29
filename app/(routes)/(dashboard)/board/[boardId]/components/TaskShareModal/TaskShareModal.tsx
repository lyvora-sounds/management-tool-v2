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

interface TaskShareModalProps {
  taskId: string;
  taskTitle: string;
  open: boolean;
  onClose: () => void;
}

export function TaskShareModal({
  taskId,
  taskTitle,
  open,
  onClose,
}: TaskShareModalProps) {
  const t = useTranslations("task");
  const tCommon = useTranslations("common");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      loadShareLink();
    }
  }, [open, taskId]);

  const loadShareLink = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/share`);
      if (res.ok) {
        const data = await res.json();
        setShareUrl(data.shareUrl);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

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

  const copyToClipboard = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success(t("shareCopied"));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Share2 size={18} className="text-primary" />
            <span>{t("sharePublicTitle")}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <p className="text-xs text-muted-foreground">
            {t("shareDescription", { title: taskTitle })}
          </p>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-muted-foreground" size={24} />
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
                  onClick={copyToClipboard}
                  className="shrink-0 h-9 w-9"
                  title={t("copyLink")}
                >
                  {copied ? (
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

              <div className="flex items-center justify-between pt-2 border-t text-xs">
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
            <div className="flex flex-col items-center justify-center py-4 gap-3 text-center">
              <div className="p-3 rounded-full bg-muted">
                <Globe size={24} className="text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground max-w-xs">
                {t("sharePrivate")}
              </p>
              <Button onClick={generateLink} size="sm" className="gap-1.5 mt-1">
                <Share2 size={14} />
                <span>{t("generatePublicLink")}</span>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
