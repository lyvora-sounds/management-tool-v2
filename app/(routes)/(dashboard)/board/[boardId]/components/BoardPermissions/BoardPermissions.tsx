"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, X, UserCheck, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface BoardPermissionsProps {
  boardId: string;
  open: boolean;
  onClose: () => void;
  initialMemberCanAssign: boolean;
}

type Team = { id: string; name: string };
type TeamGrant = { teamId: string; role: "viewer" | "member" | "admin" };

export function BoardPermissions({
  boardId,
  open,
  onClose,
  initialMemberCanAssign,
}: BoardPermissionsProps) {
  const t = useTranslations("permissions");
  const tCommon = useTranslations("common");
  const [memberCanAssign, setMemberCanAssign] = useState(initialMemberCanAssign);
  const [saving, setSaving] = useState(false);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [accessMode, setAccessMode] = useState<"organization" | "restricted">("organization");
  const [defaultRole, setDefaultRole] = useState<"viewer" | "member">("member");
  const [organizationName, setOrganizationName] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamGrants, setTeamGrants] = useState<TeamGrant[]>([]);
  const [teamName, setTeamName] = useState("");
  const [canCreateTeam, setCanCreateTeam] = useState(false);
  const [kikiMode, setKikiMode] = useState<"off" | "owner" | "member">("owner");
  const [kikiTriage, setKikiTriage] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch(`/api/boards/${boardId}/access`)
      .then(async (response) => {
        if (!response.ok) throw new Error("load failed");
        return response.json();
      })
      .then((data) => {
        setAccessMode(data.accessMode);
        setDefaultRole(data.defaultRole);
        setOrganizationName(data.organization.name);
        setOrganizationId(data.organization.id);
        setTeams(data.organization.teams);
        setTeamGrants(data.teamAccess);
        setCanCreateTeam(data.canCreateTeam === true);
        if (data.kikiMode) setKikiMode(data.kikiMode);
        setKikiTriage(data.kikiTriage === true);
      })
      .catch(() => toast.error(t("loadAccessError")))
      .finally(() => setLoadingAccess(false));
  }, [boardId, open, t]);

  if (!open) return null;

  const toggle = async (value: boolean) => {
    setSaving(true);
    const prev = memberCanAssign;
    setMemberCanAssign(value);
    const res = await fetch(`/api/boards/${boardId}/permissions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberCanAssign: value }),
    });
    if (res.ok) {
      toast.success(value ? t("membersCanAssign") : t("ownerOnly"));
    } else {
      setMemberCanAssign(prev);
      toast.error(t("saveError"));
    }
    setSaving(false);
  };

  const saveKikiMode = async (value: typeof kikiMode) => {
    const prev = kikiMode;
    setKikiMode(value);
    setSaving(true);
    const res = await fetch(`/api/boards/${boardId}/permissions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kikiMode: value }),
    });
    if (res.ok) toast.success(t("kikiSaved"));
    else {
      setKikiMode(prev);
      toast.error(t("saveError"));
    }
    setSaving(false);
  };

  const saveKikiTriage = async (value: boolean) => {
    const prev = kikiTriage;
    setKikiTriage(value);
    setSaving(true);
    const res = await fetch(`/api/boards/${boardId}/permissions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kikiTriage: value }),
    });
    if (res.ok) toast.success(t("kikiSaved"));
    else {
      setKikiTriage(prev);
      toast.error(t("saveError"));
    }
    setSaving(false);
  };

  const setTeamRole = (teamId: string, role: string) => {
    setTeamGrants((current) => {
      const remaining = current.filter((grant) => grant.teamId !== teamId);
      return role === "none"
        ? remaining
        : [...remaining, { teamId, role: role as TeamGrant["role"] }];
    });
  };

  const createTeam = async () => {
    const name = teamName.trim();
    if (!name || !organizationId) return;
    setSaving(true);
    const response = await fetch(`/api/organizations/${organizationId}/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (response.ok) {
      const team = await response.json();
      setTeams((current) => [...current, { id: team.id, name: team.name }].sort((a, b) => a.name.localeCompare(b.name)));
      setTeamName("");
      toast.success(t("teamCreated"));
    } else {
      toast.error(t("saveError"));
    }
    setSaving(false);
  };

  const saveAccess = async () => {
    setSaving(true);
    const response = await fetch(`/api/boards/${boardId}/access`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessMode, defaultRole, teamGrants }),
    });
    toast[response.ok ? "success" : "error"](
      response.ok ? t("accessSaved") : t("saveError"),
    );
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <ShieldCheck size={17} className="text-muted-foreground" />
            <span className="font-medium text-sm">{t("title")}</span>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-3">
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-start gap-3">
              <Users size={17} className="text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-medium">{t("organizationAccess")}</div>
                <div className="text-xs text-muted-foreground">
                  {organizationName ? t("organizationHint", { organization: organizationName }) : t("loading")}
                </div>
              </div>
            </div>

            <label className="block text-xs font-medium">
              {t("accessMode")}
              <select
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={accessMode}
                disabled={loadingAccess || saving}
                onChange={(event) => setAccessMode(event.target.value as typeof accessMode)}
              >
                <option value="organization">{t("everyoneInOrganization")}</option>
                <option value="restricted">{t("restricted")}</option>
              </select>
            </label>

            {accessMode === "organization" && (
              <label className="block text-xs font-medium">
                {t("organizationRole")}
                <select
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={defaultRole}
                  disabled={loadingAccess || saving}
                  onChange={(event) => setDefaultRole(event.target.value as typeof defaultRole)}
                >
                  <option value="viewer">{t("viewer")}</option>
                  <option value="member">{t("member")}</option>
                </select>
              </label>
            )}

            <div className="space-y-2">
              <div className="text-xs font-medium">{t("teamAccess")}</div>
              {teams.map((team) => (
                  <label key={team.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">{team.name}</span>
                    <select
                      className="rounded-md border bg-background px-2 py-1 text-xs"
                      value={teamGrants.find((grant) => grant.teamId === team.id)?.role ?? "none"}
                      disabled={loadingAccess || saving}
                      onChange={(event) => setTeamRole(team.id, event.target.value)}
                    >
                      <option value="none">{t("noAccess")}</option>
                      <option value="viewer">{t("viewer")}</option>
                      <option value="member">{t("member")}</option>
                      <option value="admin">{t("admin")}</option>
                    </select>
                  </label>
              ))}
              {canCreateTeam && (
                <label className="block text-xs font-medium">
                  {t("newTeam")}
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      value={teamName}
                      onChange={(event) => setTeamName(event.target.value)}
                      placeholder={t("teamNamePlaceholder")}
                      disabled={loadingAccess || saving}
                      className="min-w-0 flex-1 rounded-md border bg-background px-2 py-1 text-xs font-normal"
                    />
                    <Button size="sm" variant="outline" onClick={createTeam} disabled={loadingAccess || saving || !teamName.trim()}>
                      {t("createTeam")}
                    </Button>
                  </div>
                </label>
              )}
            </div>

            <Button size="sm" onClick={saveAccess} disabled={loadingAccess || saving}>
              {t("saveAccess")}
            </Button>
          </div>

          <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <UserCheck size={17} className="text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{t("assignTickets")}</span>
                <span className="text-xs text-muted-foreground">
                  {t("assignHint")}
                </span>
              </div>
            </div>
            <button
              disabled={saving}
              onClick={() => toggle(!memberCanAssign)}
              className={`relative shrink-0 h-5 w-9 rounded-full transition-colors ${
                memberCanAssign ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  memberCanAssign ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Sparkles size={17} className="text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-medium">{t("kikiTitle")}</div>
                <div className="text-xs text-muted-foreground">{t("kikiHint")}</div>
              </div>
            </div>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={kikiMode}
              disabled={loadingAccess || saving}
              onChange={(event) => saveKikiMode(event.target.value as typeof kikiMode)}
            >
              <option value="owner">{t("kikiOwner")}</option>
              <option value="member">{t("kikiMember")}</option>
              <option value="off">{t("kikiOff")}</option>
            </select>
            {kikiMode !== "off" && (
              <div className="flex items-start justify-between gap-4 pt-1">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{t("kikiTriage")}</span>
                  <span className="text-xs text-muted-foreground">{t("kikiTriageHint")}</span>
                </div>
                <button
                  disabled={saving}
                  onClick={() => saveKikiTriage(!kikiTriage)}
                  role="switch"
                  aria-checked={kikiTriage}
                  aria-label={t("kikiTriage")}
                  className={`relative shrink-0 h-5 w-9 rounded-full transition-colors ${kikiTriage ? "bg-primary" : "bg-muted-foreground/30"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${kikiTriage ? "translate-x-4" : "translate-x-0"}`} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="px-5 pb-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            {tCommon("close")}
          </Button>
        </div>
      </div>
    </div>
  );
}
