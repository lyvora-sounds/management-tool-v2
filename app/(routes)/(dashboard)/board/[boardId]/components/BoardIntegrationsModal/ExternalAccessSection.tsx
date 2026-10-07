"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, KeyRound, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { copyToClipboard } from "@/lib/copyText";

type AccessTokenSummary = {
  id: string;
  name: string;
  tokenPrefix: string;
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
  const [tokenName, setTokenName] = useState("");
  const [createdToken, setCreatedToken] = useState("");
  const [creatingToken, setCreatingToken] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadAccess = useCallback(async () => {
    setLoading(true);
    try {
      const tokensRes = await fetch(`/api/boards/${boardId}/external-access`);
      if (tokensRes.ok) setAccessTokens(await tokensRes.json());
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
      return;
    }
    void loadAccess();
  }, [open, loadAccess]);

  const canCreate = tokenName.trim().length > 0;

  const createAccessToken = async () => {
    if (!canCreate) return;
    setCreatingToken(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/external-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tokenName }),
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
            <Input
              readOnly
              value={createdToken}
              spellCheck={false}
              onFocus={(event) => event.currentTarget.select()}
              className="h-8 font-mono text-xs select-text"
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => {
                void copyToClipboard(createdToken).then((copied) => {
                  if (copied) toast.success(t("copied"));
                  else toast.error(t("copyError"));
                });
              }}
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
                  {token.tokenPrefix}…
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
