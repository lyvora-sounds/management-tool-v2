"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bot, Check, Copy, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { copyToClipboard } from "@/lib/copyText";

type McpScope = "organization" | "board";

type BoardSummary = {
  id: string;
  title: string;
  canIssueToken: boolean;
};

type OrganizationSummary = {
  id: string;
  name: string;
  role: string;
  boards: BoardSummary[];
};

type AccessTokenSummary = {
  id: string;
  name: string;
  tokenPrefix: string;
  lastUsedAt: string | null;
};

const SCOPES: { id: McpScope; labelKey: "mcpScopeOrganization" | "mcpScopeBoard" }[] = [
  { id: "organization", labelKey: "mcpScopeOrganization" },
  { id: "board", labelKey: "mcpScopeBoard" },
];

function clientConfig(endpoint: string, token: string) {
  return JSON.stringify(
    {
      mcpServers: {
        kikiboard: {
          url: endpoint,
          headers: { Authorization: `Bearer ${token || "kiki_YOUR_TOKEN"}` },
        },
      },
    },
    null,
    2,
  );
}

function canManage(role: string) {
  return role === "owner" || role === "admin";
}

export function McpSettings() {
  const t = useTranslations("settings");
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<McpScope>("organization");
  const [organizationId, setOrganizationId] = useState("");
  const [boardId, setBoardId] = useState("");
  const [endpoint, setEndpoint] = useState("/api/mcp");
  const [copied, setCopied] = useState<"url" | "config" | "token" | null>(null);
  const [tokenName, setTokenName] = useState("");
  const [createdToken, setCreatedToken] = useState("");
  const [creating, setCreating] = useState(false);
  const [tokens, setTokens] = useState<AccessTokenSummary[]>([]);
  const tokenListRequest = useRef(0);

  useEffect(() => {
    setEndpoint(`${window.location.origin}/api/mcp`);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/organizations");
        if (!res.ok) throw new Error("load");
        const data = (await res.json()) as OrganizationSummary[];
        if (cancelled) return;
        setOrganizations(data);
        setOrganizationId(data[0]?.id ?? "");
        setBoardId(data[0]?.boards[0]?.id ?? "");
      } catch {
        if (!cancelled) toast.error(t("mcpLoadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const organization = organizations.find((item) => item.id === organizationId) ?? null;
  const board = organization?.boards.find((item) => item.id === boardId) ?? organization?.boards[0] ?? null;
  const config = useMemo(
    () => clientConfig(endpoint, createdToken),
    [endpoint, createdToken],
  );
  const allowed = scope === "organization"
    ? !!organization && canManage(organization.role)
    : !!board?.canIssueToken;
  const canCreate = tokenName.trim().length > 0 && allowed;

  useEffect(() => {
    if (!organization) return;
    const url = scope === "organization"
      ? `/api/organizations/${organization.id}/external-access`
      : board
        ? `/api/boards/${board.id}/external-access`
        : null;
    if (!url) return;
    const requestId = ++tokenListRequest.current;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok || cancelled || requestId !== tokenListRequest.current) return;
        setTokens(await res.json());
      } catch {
        if (!cancelled && requestId === tokenListRequest.current) setTokens([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [organization, board, scope]);

  const selectOrganization = (nextId: string) => {
    const next = organizations.find((item) => item.id === nextId);
    setOrganizationId(nextId);
    setBoardId(next?.boards[0]?.id ?? "");
    setCreatedToken("");
    setTokens([]);
  };

  const selectScope = (next: McpScope) => {
    setScope(next);
    setCreatedToken("");
    setTokens([]);
  };

  const selectBoard = (nextId: string) => {
    setBoardId(nextId);
    setCreatedToken("");
    setTokens([]);
  };

  const copyValue = async (value: string, kind: "url" | "config" | "token") => {
    const ok = await copyToClipboard(value);
    if (!ok) {
      toast.error(t("mcpCopyError"));
      return;
    }
    setCopied(kind);
    toast.success(kind === "token" ? t("mcpTokenCopied") : t("mcpCopied"));
    window.setTimeout(() => setCopied((current) => (current === kind ? null : current)), 1500);
  };

  const createToken = async () => {
    if (!organization || !canCreate) return;
    if (scope === "board" && !board) return;
    setCreating(true);
    try {
      const url = scope === "organization"
        ? `/api/organizations/${organization.id}/external-access`
        : `/api/boards/${board!.id}/external-access`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tokenName.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : t("mcpTokenCreateError"));
      tokenListRequest.current += 1;
      setCreatedToken(data.token);
      setTokenName("");
      setTokens((current) => [data, ...current]);
      toast.success(t("mcpTokenCreated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("mcpTokenCreateError"));
    } finally {
      setCreating(false);
    }
  };

  const revokeToken = async (tokenId: string) => {
    if (!organization) return;
    if (scope === "board" && !board) return;
    const url = scope === "organization"
      ? `/api/organizations/${organization.id}/external-access/${tokenId}`
      : `/api/boards/${board!.id}/external-access/${tokenId}`;
    const res = await fetch(url, { method: "DELETE" });
    if (res.ok) {
      setTokens((current) => current.filter((token) => token.id !== tokenId));
      toast.success(t("mcpTokenRevoked"));
    } else {
      toast.error(t("mcpTokenRevokeError"));
    }
  };

  const scopeHint = () => {
    if (!organization) return "";
    if (scope === "board") {
      return board
        ? t("mcpScopeBoardHint", { board: board.title, name: organization.name })
        : t("mcpNoBoards");
    }
    return t("mcpScopeOrganizationHint", { name: organization.name });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="animate-spin text-muted-foreground" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Bot size={20} />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{t("mcpTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("mcpIntro")}</p>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-primary" />
          <p>{t("mcpOneOrgRule")}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          {SCOPES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectScope(item.id)}
              className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold transition-colors ${
                scope === item.id
                  ? "border-primary bg-primary/5 text-primary"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>
        {organization && <p className="text-sm text-muted-foreground">{scopeHint()}</p>}
      </div>

      {organizations.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-3">
          <p className="text-sm font-medium">{t("mcpNoOrganizations")}</p>
          <p className="text-sm text-muted-foreground">{t("mcpNoOrganizationsHint")}</p>
          <Button render={<Link href="/dashboard/organizations" />} nativeButton={false} variant="outline">
            {t("mcpOpenOrganizations")}
          </Button>
        </div>
      ) : organization && (
        <>
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
            <div className={`grid gap-4 ${scope === "board" ? "sm:grid-cols-2" : ""}`}>
              <div className="space-y-2">
                <Label>{t("mcpChooseOrganization")}</Label>
                <Select
                  value={organization.id}
                  onValueChange={(value) => {
                    if (typeof value === "string") selectOrganization(value);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>{organization.name}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {scope === "board" && (
                <div className="space-y-2">
                  <Label>{t("mcpChooseBoard")}</Label>
                  {organization.boards.length === 0 || !board ? (
                    <p className="text-sm text-muted-foreground">{t("mcpNoBoards")}</p>
                  ) : (
                    <Select
                      value={board.id}
                      onValueChange={(value) => {
                        if (typeof value === "string") selectBoard(value);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>{board.title}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {organization.boards.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
            </div>
            {scope === "board" && board && (
              <Link href={`/board/${board.id}`} className="inline-block text-sm font-medium text-primary hover:underline">
                {t("mcpOpenBoard")}
              </Link>
            )}
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-5">
            {createdToken && (
              <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:bg-amber-950/20">
                <Label htmlFor="mcp-token">{t("mcpTokenLabel")}</Label>
                <p className="text-xs text-amber-800 dark:text-amber-200">{t("mcpCopyTokenNow")}</p>
                <div className="flex gap-2">
                  <Input
                    id="mcp-token"
                    readOnly
                    value={createdToken}
                    spellCheck={false}
                    onFocus={(event) => event.currentTarget.select()}
                    className="font-mono text-xs select-text"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 gap-1.5"
                    onClick={() => copyValue(createdToken, "token")}
                  >
                    {copied === "token" ? <Check size={14} /> : <Copy size={14} />}
                    {t("mcpCopyToken")}
                  </Button>
                </div>
              </div>
            )}

            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void createToken();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="mcp-token-name">{t("mcpTokenName")}</Label>
                <Input
                  id="mcp-token-name"
                  value={tokenName}
                  onChange={(event) => setTokenName(event.target.value)}
                  placeholder={t("mcpTokenNamePlaceholder")}
                  maxLength={80}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={!canCreate || creating}>
                  {creating && <Loader2 size={14} className="animate-spin" />}
                  {t("mcpCreateToken")}
                </Button>
                <p className="text-xs text-muted-foreground">{t("mcpAdminHint")}</p>
              </div>
            </form>

            {tokens.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <h3 className="text-sm font-semibold">{t("mcpActiveTokens")}</h3>
                {tokens.map((token) => (
                  <div key={token.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{token.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {token.tokenPrefix}…
                        {" · "}
                        {token.lastUsedAt
                          ? `${t("mcpLastUsed")} ${new Date(token.lastUsedAt).toLocaleString()}`
                          : t("mcpNeverUsed")}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => revokeToken(token.id)}
                      aria-label={t("mcpRevoke")}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="mcp-url">{t("mcpEndpoint")}</Label>
              <div className="flex gap-2">
                <Input
                  id="mcp-url"
                  readOnly
                  value={endpoint}
                  onFocus={(event) => event.currentTarget.select()}
                  className="font-mono text-xs select-text"
                />
                <Button type="button" variant="outline" className="shrink-0 gap-1.5" onClick={() => copyValue(endpoint, "url")}>
                  {copied === "url" ? <Check size={14} /> : <Copy size={14} />}
                  {t("mcpCopy")}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>{t("mcpConfigTitle")}</Label>
                <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => copyValue(config, "config")}>
                  {copied === "config" ? <Check size={13} /> : <Copy size={13} />}
                  {t("mcpCopy")}
                </Button>
              </div>
              <pre className="overflow-x-auto rounded-lg border bg-muted p-3 font-mono text-xs select-text">{config}</pre>
              {!createdToken && <p className="text-xs text-muted-foreground">{t("mcpConfigHint")}</p>}
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-semibold">{t("mcpToolsTitle")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("mcpToolProject")} {t("mcpToolList")} {t("mcpToolGet")}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
