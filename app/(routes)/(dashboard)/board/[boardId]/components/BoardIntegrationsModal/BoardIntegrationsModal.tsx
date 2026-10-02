"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Webhook,
  Save,
  Loader2,
  Bell,
  MessageSquare,
  KeyRound,
  Copy,
  Trash2,
  Plus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface BoardIntegrationsModalProps {
  boardId: string;
  canManage: boolean;
  open: boolean;
  onClose: () => void;
}

type AccessTokenSummary = {
  id: string;
  name: string;
  tokenPrefix: string;
  environments: string[];
  revokedAt: string | null;
  lastUsedAt: string | null;
};

export function BoardIntegrationsModal({
  boardId,
  canManage,
  open,
  onClose,
}: BoardIntegrationsModalProps) {
  const t = useTranslations("integrations");
  const tCommon = useTranslations("common");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState("");
  const [notifyOnTaskCreated, setNotifyOnTaskCreated] = useState(true);
  const [notifyOnTaskCompleted, setNotifyOnTaskCompleted] = useState(true);
  const [notifyOnTaskMoved, setNotifyOnTaskMoved] = useState(false);
  const [accessTokens, setAccessTokens] = useState<AccessTokenSummary[]>([]);
  const [environmentOptions, setEnvironmentOptions] = useState<string[]>([]);
  const [tokenName, setTokenName] = useState("");
  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>(["*"]);
  const [createdToken, setCreatedToken] = useState("");
  const [creatingToken, setCreatingToken] = useState(false);

  const loadIntegrations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/integrations`);
      if (res.ok) {
        const data = await res.json();
        setSlackWebhookUrl(data.slackWebhookUrl || "");
        setDiscordWebhookUrl(data.discordWebhookUrl || "");
        setNotifyOnTaskCreated(data.notifyOnTaskCreated ?? true);
        setNotifyOnTaskCompleted(data.notifyOnTaskCompleted ?? true);
        setNotifyOnTaskMoved(data.notifyOnTaskMoved ?? false);
      }
      if (canManage) {
        const [tokensRes, fieldsRes] = await Promise.all([
          fetch(`/api/boards/${boardId}/external-access`),
          fetch(`/api/settings/custom-fields?boardId=${boardId}`),
        ]);
        if (tokensRes.ok) setAccessTokens(await tokensRes.json());
        if (fieldsRes.ok) {
          const fieldsData = await fieldsRes.json();
          const environmentField = fieldsData.customFields?.find(
            (field: { defaultKey?: string }) => field.defaultKey === "environment",
          );
          setEnvironmentOptions(
            Array.isArray(environmentField?.options) ? environmentField.options : [],
          );
        }
      }
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [boardId, canManage, t]);

  useEffect(() => {
    if (open) {
      loadIntegrations();
    }
  }, [open, loadIntegrations]);

  const createAccessToken = async () => {
    if (!tokenName.trim()) return;
    setCreatingToken(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/external-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tokenName, environments: selectedEnvironments }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCreatedToken(data.token);
      setTokenName("");
      setAccessTokens((current) => [data, ...current]);
      toast.success(t("tokenCreated"));
    } catch {
      toast.error(t("tokenCreateError"));
    } finally {
      setCreatingToken(false);
    }
  };

  const revokeAccessToken = async (tokenId: string) => {
    const res = await fetch(`/api/boards/${boardId}/external-access/${tokenId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setAccessTokens((current) => current.filter((token) => token.id !== tokenId));
      toast.success(t("tokenRevoked"));
    } else {
      toast.error(t("tokenRevokeError"));
    }
  };

  const toggleEnvironment = (environment: string) => {
    if (environment === "*") {
      setSelectedEnvironments(["*"]);
      return;
    }
    setSelectedEnvironments((current) => {
      const withoutWildcard = current.filter((value) => value !== "*");
      const next = withoutWildcard.includes(environment)
        ? withoutWildcard.filter((value) => value !== environment)
        : [...withoutWildcard, environment];
      return next.length ? next : ["*"];
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/integrations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slackWebhookUrl,
          discordWebhookUrl,
          notifyOnTaskCreated,
          notifyOnTaskCompleted,
          notifyOnTaskMoved,
        }),
      });

      if (res.ok) {
        toast.success(t("saved"));
        onClose();
      } else {
        toast.error(t("saveError"));
      }
    } catch {
      toast.error(tCommon("connectionError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Webhook size={18} className="text-primary" />
            <span>{t("title")}</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-muted-foreground" size={24} />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6 pt-2">
            {/* Slack Webhook */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <MessageSquare size={14} className="text-emerald-600" />
                <span>{t("slackUrl")}</span>
              </Label>
              <Input
                placeholder="https://hooks.slack.com/services/..."
                value={slackWebhookUrl}
                onChange={(e) => setSlackWebhookUrl(e.target.value)}
                className="text-xs font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                {t("slackHint")}
              </p>
            </div>

            {/* Discord Webhook */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <MessageSquare size={14} className="text-indigo-500" />
                <span>{t("discordUrl")}</span>
              </Label>
              <Input
                placeholder="https://discord.com/api/webhooks/..."
                value={discordWebhookUrl}
                onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                className="text-xs font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                {t("discordHint")}
              </p>
            </div>

            {/* Event Triggers */}
            <div className="space-y-3 p-4 rounded-xl border bg-muted/30">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Bell size={13} />
                <span>{t("events")}</span>
              </Label>

              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="trigger-create"
                    checked={notifyOnTaskCreated}
                    onCheckedChange={(c) => setNotifyOnTaskCreated(Boolean(c))}
                  />
                  <label
                    htmlFor="trigger-create"
                    className="text-xs font-medium cursor-pointer"
                  >
                    {t("onCreate")}
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="trigger-complete"
                    checked={notifyOnTaskCompleted}
                    onCheckedChange={(c) => setNotifyOnTaskCompleted(Boolean(c))}
                  />
                  <label
                    htmlFor="trigger-complete"
                    className="text-xs font-medium cursor-pointer"
                  >
                    {t("onComplete")}
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="trigger-move"
                    checked={notifyOnTaskMoved}
                    onCheckedChange={(c) => setNotifyOnTaskMoved(Boolean(c))}
                  />
                  <label
                    htmlFor="trigger-move"
                    className="text-xs font-medium cursor-pointer"
                  >
                    {t("onMove")}
                  </label>
                </div>
              </div>
            </div>

            {canManage && (
              <div className="space-y-3 rounded-xl border p-4">
                <div>
                  <Label className="flex items-center gap-1.5 text-xs font-semibold">
                    <KeyRound size={14} />
                    {t("mcpTitle")}
                  </Label>
                  <p className="mt-1 text-[11px] text-muted-foreground">{t("mcpHint")}</p>
                </div>

                {createdToken && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 dark:bg-amber-950/20">
                    <p className="mb-2 text-[11px] font-medium">{t("copyTokenNow")}</p>
                    <div className="flex gap-2">
                      <Input readOnly value={createdToken} className="h-8 font-mono text-xs" />
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => navigator.clipboard.writeText(createdToken)}
                        aria-label={t("copyToken")}
                      >
                        <Copy size={14} />
                      </Button>
                    </div>
                  </div>
                )}

                <Input
                  value={tokenName}
                  onChange={(event) => setTokenName(event.target.value)}
                  placeholder={t("tokenNamePlaceholder")}
                  className="h-8 text-xs"
                  maxLength={80}
                />
                <div className="space-y-2">
                  <p className="text-[11px] font-medium">{t("allowedEnvironments")}</p>
                  <div className="flex flex-wrap gap-3">
                    {["*", ...environmentOptions].map((environment) => (
                      <label key={environment} className="flex items-center gap-1.5 text-xs">
                        <Checkbox
                          checked={selectedEnvironments.includes(environment)}
                          onCheckedChange={() => toggleEnvironment(environment)}
                        />
                        {environment === "*" ? t("allEnvironments") : environment}
                      </label>
                    ))}
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={creatingToken || !tokenName.trim()}
                  onClick={createAccessToken}
                >
                  {creatingToken ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  {t("createToken")}
                </Button>

                {accessTokens.length > 0 && (
                  <div className="space-y-2 border-t pt-3">
                    {accessTokens.filter((token) => !token.revokedAt).map((token) => (
                      <div key={token.id} className="flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{token.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {token.tokenPrefix}… · {token.environments.join(", ")}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => revokeAccessToken(token.id)}
                          aria-label={t("revokeToken")}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" size="sm" disabled={saving} className="gap-1.5">
                {saving ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Save size={13} />
                )}
                <span>{t("save")}</span>
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
