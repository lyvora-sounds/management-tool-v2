"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
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
import { mcpConnectionName, mcpScopeEndpoint } from "@/lib/mcp/connectionName";
import { McpConnectionGuide } from "./McpConnectionGuide";
import { McpChangeHistory } from "./McpChangeHistory";

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
  createdAt: string;
  scopes: string[];
  organization: { id: string; name: string };
  board: { id: string; title: string } | null;
};

const SCOPES: { id: McpScope; labelKey: "mcpScopeOrganization" | "mcpScopeBoard" }[] = [
  { id: "organization", labelKey: "mcpScopeOrganization" },
  { id: "board", labelKey: "mcpScopeBoard" },
];

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
  const [origin, setOrigin] = useState("");
  const [tokenCopied, setTokenCopied] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [access, setAccess] = useState<"read" | "write">("read");
  const [createdToken, setCreatedToken] = useState("");
  const [creating, setCreating] = useState(false);
  const [tokens, setTokens] = useState<AccessTokenSummary[]>([]);
  const [tokensLoading, setTokensLoading] = useState(true);

  useEffect(() => {
    const configured = process.env.NEXT_PUBLIC_APP_URL;
    setOrigin(configured ? new URL(configured).origin : window.location.origin);
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
  const allowed = scope === "organization"
    ? !!organization && canManage(organization.role)
    : !!board?.canIssueToken;
  const canCreate = tokenName.trim().length > 0 && allowed;
  const endpoint = mcpScopeEndpoint(origin, scope, organization?.id, scope === "board" ? board?.id : undefined);
  const connectionName = mcpConnectionName(scope === "board" && board ? board.title : organization?.name ?? "");

  const loadMyTokens = async () => {
    const res = await fetch("/api/settings/mcp/tokens");
    if (!res.ok) throw new Error("load");
    setTokens(await res.json());
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/settings/mcp/tokens");
        if (!res.ok) throw new Error("load");
        const data = (await res.json()) as AccessTokenSummary[];
        if (!cancelled) setTokens(data);
      } catch {
        if (!cancelled) toast.error(t("mcpTokensLoadError"));
      } finally {
        if (!cancelled) setTokensLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const selectOrganization = (nextId: string) => {
    const next = organizations.find((item) => item.id === nextId);
    setOrganizationId(nextId);
    setBoardId(next?.boards[0]?.id ?? "");
    setCreatedToken("");
  };

  const selectScope = (next: McpScope) => {
    if (next === scope) return;
    setScope(next);
    setCreatedToken("");
  };

  const selectBoard = (nextId: string) => {
    setBoardId(nextId);
    setCreatedToken("");
  };

  const copyToken = async () => {
    const ok = await copyToClipboard(createdToken);
    if (!ok) {
      toast.error(t("mcpCopyError"));
      return;
    }
    setTokenCopied(true);
    toast.success(t("mcpTokenCopied"));
    window.setTimeout(() => setTokenCopied(false), 1500);
  };

  const createToken = async () => {
    if (!organization || !canCreate) return;
    if (scope === "board" && !board) return;
    setCreating(true);
    try {
      const url = scope === "organization"
        ? `/api/organizations/${organization.id}/external-access`
        : `/api/boards/${board!.id}/external-access`;
      const res = await apiFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tokenName.trim(), access }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(typeof data?.message === "string" ? data.message : typeof data?.error === "string" ? data.error : t("mcpTokenCreateError"));
      setCreatedToken(data.token);
      setTokenName("");
      toast.success(t("mcpTokenCreated"));
      try {
        await loadMyTokens();
      } catch {
        toast.error(t("mcpTokensLoadError"));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("mcpTokenCreateError"));
    } finally {
      setCreating(false);
    }
  };

  const revokeToken = async (token: AccessTokenSummary) => {
    if (!window.confirm(t("mcpRevokeConfirm", { name: token.name }))) return;
    const res = await fetch("/api/settings/mcp/tokens", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: token.id }),
    });
    if (res.ok) {
      setTokens((current) => current.filter((item) => item.id !== token.id));
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
      <div className="rounded-xl border bg-card p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Bot size={20} />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{t("mcpTitle")}</h2>
          </div>
        </div>
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-primary" />
          <p>{t("mcpOneOrgRule")}</p>
        </div>
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
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <fieldset aria-label={t("mcpScopeTitle")} className="m-0 min-w-0 divide-y border-0 p-0">
            {SCOPES.map((item) => {
              const selected = scope === item.id;
              return (
                <div key={item.id} className={selected ? "bg-primary/5" : undefined}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => selectScope(item.id)}
                    className="flex w-full items-start gap-3 px-5 py-4 text-left sm:px-6"
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${
                        selected ? "border-primary" : "border-muted-foreground/50"
                      }`}
                    >
                      {selected && <span className="size-2 rounded-full bg-primary" />}
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-sm font-semibold ${selected ? "text-primary" : "text-foreground"}`}>
                        {t(item.labelKey)}
                      </span>
                      {selected && (
                        <span className="mt-1 block text-sm font-normal text-muted-foreground">{scopeHint()}</span>
                      )}
                    </span>
                  </button>
                  {selected && (
                    <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2 sm:px-6">
                      <div className="space-y-2">
                        <Label>{t("mcpChooseOrganization")}</Label>
                        <Select
                          value={organization.id}
                          onValueChange={(value) => {
                            if (typeof value === "string") selectOrganization(value);
                          }}
                        >
                          <SelectTrigger className="w-full bg-background">
                            <SelectValue>{organization.name}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {organizations.map((org) => (
                              <SelectItem key={org.id} value={org.id}>
                                {org.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {item.id === "board" && board && (
                        <div className="space-y-2">
                          <Label>{t("mcpChooseBoard")}</Label>
                          <Select
                            value={board.id}
                            onValueChange={(value) => {
                              if (typeof value === "string") selectBoard(value);
                            }}
                          >
                            <SelectTrigger className="w-full bg-background">
                              <SelectValue>{board.title}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {organization.boards.map((boardOption) => (
                                <SelectItem key={boardOption.id} value={boardOption.id}>
                                  {boardOption.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Link href={`/board/${board.id}`} className="inline-block text-xs font-medium text-primary hover:underline">
                            {t("mcpOpenBoard")}
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </fieldset>

          <div className="space-y-5 border-t p-5 sm:p-6">
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
                    onClick={() => void copyToken()}
                  >
                    {tokenCopied ? <Check size={14} /> : <Copy size={14} />}
                    {t("mcpCopyToken")}
                  </Button>
                </div>
              </div>
            )}

            <form
              className="grid items-start gap-x-4 gap-y-2 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                void createToken();
              }}
            >
              <Label htmlFor="mcp-token-name" className="order-1">{t("mcpTokenName")}</Label>
              <label className="order-3 flex min-w-0 items-start gap-2 text-sm leading-snug sm:order-2">
                <input
                  type="checkbox"
                  className="mt-0.5 shrink-0"
                  checked={access === "write"}
                  onChange={(event) => setAccess(event.target.checked ? "write" : "read")}
                />
                <span className="min-w-0">{t("mcpWriteAccess")}</span>
              </label>
              <Input
                id="mcp-token-name"
                className="order-2 sm:order-3"
                value={tokenName}
                onChange={(event) => setTokenName(event.target.value)}
                placeholder={t("mcpTokenNamePlaceholder")}
                maxLength={80}
              />
              <div className="order-4 space-y-2">
                <Button type="submit" disabled={!canCreate || creating}>
                  {creating && <Loader2 size={14} className="animate-spin" />}
                  {t("mcpCreateToken")}
                </Button>
                <p className="text-xs text-muted-foreground">{t("mcpAdminHint")}</p>
              </div>
            </form>

          </div>
        </div>
      )}

      <div className="rounded-xl border bg-card p-5 sm:p-6 shadow-sm space-y-3">
        <div>
          <h3 className="text-sm font-semibold">{t("mcpYourTokens")}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{t("mcpYourTokensHint")}</p>
        </div>
        {tokensLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-muted-foreground" size={20} />
          </div>
        ) : tokens.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("mcpNoTokens")}</p>
        ) : (
          <ul className="space-y-2">
            {tokens.map((token) => (
              <li key={token.id} className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{token.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {token.board
                      ? t("mcpTokenBoardScope", { title: token.board.title, name: token.organization.name })
                      : t("mcpTokenOrgScope", { name: token.organization.name })}
                    {" · "}
                    {t(token.scopes.includes("tickets:write") ? "mcpReadWrite" : "mcpReadOnly")}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
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
                  onClick={() => void revokeToken(token)}
                  aria-label={t("mcpRevoke")}
                >
                  <Trash2 size={14} />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <McpConnectionGuide endpoint={endpoint} connectionName={connectionName} />
      {organization && allowed && (
        <McpChangeHistory key={`${organization.id}:${scope}:${board?.id ?? ""}`} organizationId={organization.id} boardId={scope === "board" ? board?.id ?? null : null} />
      )}
    </div>
  );
}
