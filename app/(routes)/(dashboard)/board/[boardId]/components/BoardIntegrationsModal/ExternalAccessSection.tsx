"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, KeyRound, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type AccessTokenSummary = {
  id: string;
  name: string;
  tokenPrefix: string;
  allEnvironments: boolean;
  environments: string[];
  lastUsedAt: string | null;
};

export function ExternalAccessSection({
  boardId,
  open,
}: {
  boardId: string;
  open: boolean;
}) {
  const t = useTranslations("integrations");
  const [accessTokens, setAccessTokens] = useState<AccessTokenSummary[]>([]);
  const [environmentOptions, setEnvironmentOptions] = useState<string[]>([]);
  const [tokenName, setTokenName] = useState("");
  const [allEnvironments, setAllEnvironments] = useState(false);
  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>([]);
  const [createdToken, setCreatedToken] = useState("");
  const [creatingToken, setCreatingToken] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadAccess = useCallback(async () => {
    setLoading(true);
    try {
      const [tokensRes, fieldsRes] = await Promise.all([
        fetch(`/api/boards/${boardId}/external-access`),
        fetch(`/api/settings/custom-fields?boardId=${boardId}`),
      ]);
      if (tokensRes.ok) setAccessTokens(await tokensRes.json());
      if (fieldsRes.ok) {
        const fieldsData = await fieldsRes.json();
        const environmentField = fieldsData.customFields?.find(
          (field: { defaultKey?: string; options?: unknown }) => field.defaultKey === "environment",
        );
        setEnvironmentOptions(
          Array.isArray(environmentField?.options)
            ? environmentField.options.filter((option: unknown): option is string => typeof option === "string")
            : [],
        );
      }
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [boardId, t]);

  useEffect(() => {
    if (!open) {
      setCreatedToken("");
      setTokenName("");
      setAllEnvironments(false);
      setSelectedEnvironments([]);
      return;
    }
    void loadAccess();
  }, [open, loadAccess]);

  const canCreate = tokenName.trim().length > 0 && (allEnvironments || selectedEnvironments.length > 0);

  const createAccessToken = async () => {
    if (!canCreate) return;
    setCreatingToken(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/external-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tokenName,
          allEnvironments,
          environments: allEnvironments ? [] : selectedEnvironments,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCreatedToken(data.token);
      setTokenName("");
      setAllEnvironments(false);
      setSelectedEnvironments([]);
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
    setAllEnvironments(false);
    setSelectedEnvironments((current) =>
      current.includes(environment)
        ? current.filter((value) => value !== environment)
        : [...current, environment],
    );
  };

  return (
    <form
      className="space-y-3 rounded-xl border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        void createAccessToken();
      }}
    >
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
          <label className="flex items-center gap-1.5 text-xs">
            <Checkbox
              checked={allEnvironments}
              onCheckedChange={(checked) => {
                const enabled = checked === true;
                setAllEnvironments(enabled);
                if (enabled) setSelectedEnvironments([]);
              }}
            />
            {t("allEnvironments")}
          </label>
          {environmentOptions.map((environment) => (
            <label key={environment} className="flex items-center gap-1.5 text-xs">
              <Checkbox
                checked={!allEnvironments && selectedEnvironments.includes(environment)}
                onCheckedChange={() => toggleEnvironment(environment)}
              />
              {environment}
            </label>
          ))}
        </div>
      </div>
      <Button type="submit" size="sm" variant="outline" className="gap-1.5" disabled={creatingToken || !canCreate}>
        {creatingToken ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
        {t("createToken")}
      </Button>

      {loading ? (
        <div className="flex justify-center py-2">
          <Loader2 className="animate-spin text-muted-foreground" size={16} />
        </div>
      ) : accessTokens.length > 0 ? (
        <div className="space-y-2 border-t pt-3">
          {accessTokens.map((token) => (
            <div key={token.id} className="flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0">
                <p className="truncate font-medium">{token.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {token.tokenPrefix}… · {token.allEnvironments ? t("allEnvironments") : token.environments.join(", ")}
                  {" · "}
                  {token.lastUsedAt
                    ? `${t("lastUsed")} ${new Date(token.lastUsedAt).toLocaleString()}`
                    : t("neverUsed")}
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
      ) : null}
    </form>
  );
}
