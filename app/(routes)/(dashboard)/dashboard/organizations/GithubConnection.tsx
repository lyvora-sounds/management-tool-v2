"use client";

import { useEffect, useRef, useState } from "react";
import { Github, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";

type GithubConnectionView = {
  accountLogin: string;
  accountType: "Organization" | "User";
  repositoryId: string | null;
  repositoryName: string | null;
  branch: string | null;
  settingsUrl?: string;
};

type GithubChoice = {
  installationId: string;
  accountLogin: string;
  accountType: "Organization" | "User";
};

type GithubRepo = { id: string; fullName: string; defaultBranch: string };

export function GithubConnection({
  organizationId,
  canManage,
}: {
  organizationId: string;
  canManage: boolean;
}) {
  const t = useTranslations("organizations");
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [connection, setConnection] = useState<GithubConnectionView | null>(null);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [repositoryId, setRepositoryId] = useState("");
  const [branch, setBranch] = useState("");
  const [branchesLoaded, setBranchesLoaded] = useState(false);
  const [reposLoaded, setReposLoaded] = useState(false);
  const [reposTruncated, setReposTruncated] = useState(false);
  const [branchesTruncated, setBranchesTruncated] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [choices, setChoices] = useState<GithubChoice[]>([]);
  const [choiceId, setChoiceId] = useState("");
  const [saving, setSaving] = useState(false);
  const [reconnect, setReconnect] = useState(false);
  const defaultBranchByRepo = useRef<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/organizations/${organizationId}/github`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<{
          configured: boolean;
          connection: GithubConnectionView | null;
          pendingApproval?: boolean;
          choices?: GithubChoice[];
        }>;
      })
      .then((data) => {
        if (cancelled) return;
        setConfigured(data.configured);
        setConnection(data.connection);
        setRepositoryId(data.connection?.repositoryId ?? "");
        setBranch(data.connection?.branch ?? "");
        setPendingApproval(Boolean(data.pendingApproval));
        setChoices(data.choices ?? []);
        setChoiceId(data.choices?.[0]?.installationId ?? "");
      })
      .catch(() => {
        if (!cancelled) toast.error(t("githubLoadError"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [organizationId, t]);

  const accountKey = connection ? `${connection.accountLogin}:${connection.accountType}` : "";

  useEffect(() => {
    if (!configured || !canManage || !accountKey) return;
    let cancelled = false;
    fetch(`/api/organizations/${organizationId}/github/repositories`, { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 409) {
          if (!cancelled) setReconnect(true);
          return { repositories: [] as GithubRepo[], truncated: false };
        }
        if (!response.ok) throw new Error();
        if (!cancelled) setReconnect(false);
        return response.json() as Promise<{ repositories?: GithubRepo[]; truncated?: boolean }>;
      })
      .then((data) => {
        if (cancelled) return;
        const rows = data.repositories ?? [];
        defaultBranchByRepo.current = Object.fromEntries(rows.map((repo) => [repo.id, repo.defaultBranch]));
        setRepos(rows);
        setReposTruncated(Boolean(data.truncated));
      })
      .catch(() => {
        if (!cancelled) toast.error(t("githubLoadError"));
      })
      .finally(() => {
        if (!cancelled) setReposLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [accountKey, canManage, configured, organizationId, t]);

  useEffect(() => {
    if (!configured || !canManage || !repositoryId || !reposLoaded) return;
    let cancelled = false;
    const preferred = defaultBranchByRepo.current[repositoryId] ?? "";
    fetch(`/api/organizations/${organizationId}/github/branches?repositoryId=${encodeURIComponent(repositoryId)}`, { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 409) {
          if (!cancelled) setReconnect(true);
          return { branches: [] as string[], truncated: false };
        }
        if (!response.ok) throw new Error();
        return response.json() as Promise<{ branches?: string[]; truncated?: boolean }>;
      })
      .then((data) => {
        if (cancelled) return;
        const names = data.branches ?? [];
        setBranches(names);
        setBranchesTruncated(Boolean(data.truncated));
        setBranch((current) => {
          if (current && (names.includes(current) || data.truncated)) return current;
          if (preferred && names.includes(preferred)) return preferred;
          return "";
        });
      })
      .catch(() => {
        if (!cancelled) toast.error(t("githubLoadError"));
      })
      .finally(() => {
        if (!cancelled) setBranchesLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [canManage, configured, organizationId, reposLoaded, repositoryId, t]);

  if (loading && !canManage) return null;
  if (!loading && !canManage && !connection) return null;

  const reposLoading = Boolean(connection && configured && canManage && !reposLoaded);
  const branchesLoading = Boolean(repositoryId && canManage && configured && !branchesLoaded);
  const accountLabel = connection?.accountType === "Organization"
    ? t("githubOrganizationAccount")
    : t("githubUserAccount");
  const installPath = `/api/organizations/${organizationId}/github/install`;
  const finishPath = `/api/organizations/${organizationId}/github/finish`;
  const repoOptions = repositoryId && connection?.repositoryName && !repos.some((repo) => repo.id === repositoryId)
    ? [{ id: repositoryId, fullName: connection.repositoryName, defaultBranch: connection.branch ?? "" }, ...repos]
    : repos;

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/organizations/${organizationId}/github`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryId, branch }),
      });
      if (response.ok) {
        const data = await response.json() as { connection: GithubConnectionView | null };
        setConnection(data.connection);
        toast.success(t("githubSaved"));
      } else if (response.status === 409) {
        setReconnect(true);
      } else {
        toast.error(t("githubSaveError"));
      }
    } catch {
      toast.error(t("githubSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const chooseAccount = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/organizations/${organizationId}/github/choose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ installationId: choiceId }),
      });
      if (response.ok) {
        const data = await response.json() as { connection: GithubConnectionView | null };
        setConnection(data.connection);
        setChoices([]);
        setPendingApproval(false);
        toast.success(t("githubConnected"));
      } else if (response.status === 409) {
        setReconnect(true);
      } else {
        toast.error(t("githubConnectError"));
      }
    } catch {
      toast.error(t("githubConnectError"));
    } finally {
      setSaving(false);
    }
  };

  const openGithub = async (path: string) => {
    setSaving(true);
    try {
      const response = await fetch(path, { method: "POST" });
      const data = response.ok ? await response.json() as { url?: unknown } : null;
      const target = typeof data?.url === "string" ? new URL(data.url) : null;
      if (target?.origin === "https://github.com") {
        window.location.assign(target.toString());
        return;
      }
      toast.error(t("githubConnectError"));
    } catch {
      toast.error(t("githubConnectError"));
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async () => {
    if (!window.confirm(t("githubDisconnectConfirm"))) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/organizations/${organizationId}/github`, { method: "DELETE" });
      if (response.ok) {
        setConnection(null);
        setRepositoryId("");
        setBranch("");
        setRepos([]);
        setBranches([]);
        setChoices([]);
        setPendingApproval(false);
        toast.success(t("githubDisconnected"));
      } else if (response.status === 503) {
        toast.error(t("githubNotConfigured"));
      } else {
        toast.error(t("githubDisconnectError"));
      }
    } catch {
      toast.error(t("githubDisconnectError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 border-t p-4">
      <div className="flex items-center gap-2 text-sm font-semibold"><Github size={16} />{t("githubTitle")}</div>
      <p className="text-xs text-muted-foreground">{t("githubHint")}</p>
      {loading ? <Loader2 className="animate-spin text-muted-foreground" size={16} /> : null}
      {!loading && !configured ? <p className="text-xs text-muted-foreground">{t("githubNotConfigured")}</p> : null}
      {!loading && configured && !connection && canManage && choices.length === 0 && !pendingApproval ? (
        <Button size="sm" disabled={saving} onClick={() => { void openGithub(installPath); }}>{t("githubConnect")}</Button>
      ) : null}
      {!loading && configured && canManage && pendingApproval && choices.length === 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{t("githubPending")}</p>
          <Button size="sm" variant="outline" disabled={saving} onClick={() => { void openGithub(finishPath); }}>{t("githubFinish")}</Button>
        </div>
      ) : null}
      {!loading && configured && canManage && choices.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={choiceId}
            disabled={saving}
            onChange={(event) => setChoiceId(event.target.value)}
          >
            {choices.map((choice) => (
              <option key={choice.installationId} value={choice.installationId}>
                {choice.accountLogin}
              </option>
            ))}
          </select>
          <Button type="button" size="sm" onClick={() => void chooseAccount()} disabled={saving || !choiceId}>
            {t("githubChooseAccount")}
          </Button>
        </div>
      ) : null}
      {!loading && reconnect ? <p className="text-xs text-destructive">{t("githubReconnect")}</p> : null}
      {!loading && connection ? (
        <div className="space-y-3">
          <p className="text-sm">
            <span className="text-muted-foreground">{t("githubAccount")}: </span>
            <span className="font-medium">{connection.accountLogin}</span>
            <span className="text-muted-foreground"> · {accountLabel}</span>
          </p>
          {canManage && configured ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="space-y-1 text-xs font-medium">
                {t("githubRepository")}
                <select
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm font-normal"
                  value={repositoryId}
                  disabled={reposLoading || saving}
                  onChange={(event) => {
                    setRepositoryId(event.target.value);
                    setBranch("");
                    setBranches([]);
                    setBranchesLoaded(false);
                    setBranchesTruncated(false);
                  }}
                >
                  <option value="">{t("githubSelectRepository")}</option>
                  {repoOptions.map((repo) => <option key={repo.id} value={repo.id}>{repo.fullName}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-xs font-medium">
                {t("githubBranch")}
                <select
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm font-normal"
                  value={branch}
                  disabled={!repositoryId || branchesLoading || saving}
                  onChange={(event) => setBranch(event.target.value)}
                >
                  <option value="">{t("githubSelectBranch")}</option>
                  {branch && !branches.includes(branch) ? <option value={branch}>{branch}</option> : null}
                  {branches.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              </label>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {connection.repositoryName ?? t("githubSelectRepository")}
              {connection.branch ? ` · ${connection.branch}` : ""}
            </p>
          )}
          {canManage && configured && repos.length === 0 && !reposLoading && !reconnect ? (
            <p className="text-xs text-muted-foreground">{t("githubEmptyRepos")}</p>
          ) : null}
          {canManage && configured && repositoryId && branchesLoaded && branches.length === 0 && !branchesTruncated ? (
            <p className="text-xs text-muted-foreground">{t("githubEmptyBranches")}</p>
          ) : null}
          {canManage && (reposTruncated || branchesTruncated) ? (
            <p className="text-xs text-muted-foreground">{t("githubListTruncated")}</p>
          ) : null}
          {canManage ? (
            <div className="flex flex-wrap gap-2">
              {configured ? (
                <Button type="button" size="sm" onClick={() => void save()} disabled={saving || !repositoryId || !branch}>
                  {saving ? <Loader2 className="animate-spin" size={14} /> : null}
                  {t("githubSave")}
                </Button>
              ) : null}
              {connection.settingsUrl ? (
                <a className={buttonVariants({ size: "sm", variant: "outline" })} href={connection.settingsUrl} target="_blank" rel="noreferrer">
                  {t("githubChangeAccess")}
                </a>
              ) : null}
              <Button type="button" size="sm" variant="destructive" onClick={() => void disconnect()} disabled={saving}>
                {t("githubDisconnect")}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
