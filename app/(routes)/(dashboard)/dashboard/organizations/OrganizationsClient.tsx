"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AlertTriangle, ArrowRightLeft, Building2, ChevronDown, ChevronRight, FolderKanban, Loader2, Plus, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Board = { id: string; title: string; color: string | null; canMove: boolean };
type Organization = {
  id: string;
  name: string;
  description: string | null;
  role: "owner" | "admin" | "member";
  boards: Board[];
  _count: { boards: number; members: number; teams: number };
};
type Member = { role: string; user: { id: string; name: string | null; email: string } };
type Team = { id: string; name: string; members: { user: Member["user"] }[] };

export function OrganizationsClient() {
  const t = useTranslations("organizations");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [members, setMembers] = useState<Record<string, Member[]>>({});
  const [teams, setTeams] = useState<Record<string, Team[]>>({});
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("member");
  const [teamName, setTeamName] = useState("");
  const [teamMemberSelection, setTeamMemberSelection] = useState<Record<string, string>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [movingBoard, setMovingBoard] = useState<{ board: Board; source: Organization } | null>(null);
  const [destinationId, setDestinationId] = useState("");
  const [moveStep, setMoveStep] = useState<"select" | "confirm">("select");
  const [moveConfirmation, setMoveConfirmation] = useState("");
  const [moving, setMoving] = useState(false);

  const loadOrganizations = useCallback(async () => {
    const response = await fetch("/api/organizations");
    if (!response.ok) throw new Error();
    setOrganizations(await response.json());
  }, []);

  useEffect(() => {
    fetch("/api/organizations")
      .then(async (response) => {
        if (!response.ok) throw new Error();
        setOrganizations(await response.json());
      })
      .catch(() => toast.error(t("loadError")))
      .finally(() => setLoading(false));
  }, [t]);

  const loadDetails = async (organizationId: string) => {
    const [membersResponse, teamsResponse] = await Promise.all([
      fetch(`/api/organizations/${organizationId}/members`),
      fetch(`/api/organizations/${organizationId}/teams`),
    ]);
    const memberData = membersResponse.ok ? await membersResponse.json() : [];
    const teamData = teamsResponse.ok ? await teamsResponse.json() : [];
    setMembers((value) => ({ ...value, [organizationId]: memberData }));
    setTeams((value) => ({ ...value, [organizationId]: teamData }));
  };

  const toggle = async (organizationId: string) => {
    const next = expanded === organizationId ? null : organizationId;
    setExpanded(next);
    if (next && !members[next]) await loadDetails(next);
  };

  const createOrganization = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    const response = await fetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    if (response.ok) {
      setName("");
      setDescription("");
      setCreateOpen(false);
      await loadOrganizations();
      toast.success(t("created"));
    } else toast.error(t("createError"));
    setCreating(false);
  };

  const addMember = async (organizationId: string) => {
    const response = await fetch(`/api/organizations/${organizationId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: memberEmail, role: memberRole }),
    });
    if (response.ok) {
      setMemberEmail("");
      await Promise.all([loadDetails(organizationId), loadOrganizations()]);
      toast.success(t("memberAdded"));
    } else {
      const data = await response.json().catch(() => null);
      toast.error(data?.error ?? t("memberError"));
    }
  };

  const addTeam = async (organizationId: string) => {
    const response = await fetch(`/api/organizations/${organizationId}/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: teamName }),
    });
    if (response.ok) {
      setTeamName("");
      await Promise.all([loadDetails(organizationId), loadOrganizations()]);
      toast.success(t("teamCreated"));
    } else toast.error(t("teamError"));
  };

  const addTeamMember = async (organizationId: string, teamId: string) => {
    const userId = teamMemberSelection[teamId];
    if (!userId) return;
    const response = await fetch(`/api/organizations/${organizationId}/teams/${teamId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (response.ok) {
      setTeamMemberSelection((value) => ({ ...value, [teamId]: "" }));
      await loadDetails(organizationId);
      toast.success(t("teamMemberAdded"));
    } else toast.error(t("teamMemberError"));
  };

  const beginMove = (board: Board, source: Organization) => {
    const firstDestination = organizations.find((organization) => organization.id !== source.id && (organization.role === "owner" || organization.role === "admin"));
    setMovingBoard({ board, source });
    setDestinationId(firstDestination?.id ?? "");
    setMoveStep("select");
    setMoveConfirmation("");
  };

  const moveBoard = async () => {
    if (!movingBoard || !destinationId) return;
    setMoving(true);
    const response = await fetch(`/api/boards/${movingBoard.board.id}/organization`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: destinationId, confirmation: moveConfirmation }),
    });
    if (response.ok) {
      await loadOrganizations();
      router.refresh();
      setMovingBoard(null);
      toast.success(t("boardMoved"));
    } else {
      const data = await response.json().catch(() => null);
      toast.error(data?.error ?? t("moveError"));
    }
    setMoving(false);
  };

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button />}><Plus className="mr-2" size={16} />{t("create")}</DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("create")}</DialogTitle><DialogDescription>{t("createHint")}</DialogDescription></DialogHeader>
            <form id="create-organization" onSubmit={createOrganization} className="space-y-3">
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder={t("namePlaceholder")} maxLength={100} autoFocus />
              <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t("descriptionPlaceholder")} />
            </form>
            <DialogFooter><Button type="submit" form="create-organization" disabled={creating || !name.trim()}>{creating ? <Loader2 className="mr-2 animate-spin" size={16} /> : <Plus className="mr-2" size={16} />}{t("create")}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : organizations.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{t("empty")}</div>
      ) : (
        <div className="space-y-4">
          {organizations.map((organization) => {
            const canManage = organization.role === "owner" || organization.role === "admin";
            const open = expanded === organization.id;
            return (
              <section key={organization.id} className="overflow-hidden rounded-xl border-l-4 border-y border-r bg-card shadow-sm" style={{ borderLeftColor: organization.boards[0]?.color ?? "var(--primary)" }}>
                <button type="button" onClick={() => void toggle(organization.id)} className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/40">
                  {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <Building2 size={20} className="text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{organization.name}</span><Badge variant="secondary">{organization.role}</Badge></div>
                    {organization.description && <p className="truncate text-xs text-muted-foreground">{organization.description}</p>}
                  </div>
                  <div className="hidden items-center gap-2 sm:flex"><Badge variant="outline">{t("boardCount", { count: organization._count.boards })}</Badge><Badge variant="outline">{t("memberCount", { count: organization._count.members })}</Badge><Badge variant="outline">{t("teamCount", { count: organization._count.teams })}</Badge></div>
                </button>

                <div className="border-t px-4 py-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground"><FolderKanban size={14} />{t("boards")}</div>
                  {organization.boards.length ? (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {organization.boards.map((board) => (
                        <div key={board.id} className="group flex items-center gap-2 rounded-lg border bg-background p-2 text-sm hover:border-primary/40 hover:shadow-sm">
                          <Link href={`/board/${board.id}`} className="flex min-w-0 flex-1 items-center gap-2 px-1 py-1">
                            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: board.color ?? "#64748b" }} />
                            <span className="truncate font-medium">{board.title}</span>
                          </Link>
                          {board.canMove && organizations.some((candidate) => candidate.id !== organization.id && (candidate.role === "owner" || candidate.role === "admin")) && (
                            <Button type="button" size="icon-sm" variant="ghost" onClick={() => beginMove(board, organization)} aria-label={t("moveBoard")} title={t("moveBoard")}><ArrowRightLeft size={14} /></Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-muted-foreground">{t("noBoards")}</p>}
                </div>

                {open && (
                  <div className="grid gap-5 border-t p-4 lg:grid-cols-2">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold"><Users size={16} />{t("members")}</div>
                      {(members[organization.id] ?? []).map((member) => (
                        <div key={member.user.id} className="flex items-center justify-between text-sm"><span className="truncate">{member.user.name || member.user.email}</span><Badge variant="outline">{member.role}</Badge></div>
                      ))}
                      {canManage && <div className="flex gap-2"><Input value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} placeholder={t("memberEmail")} /><select className="rounded-md border bg-background px-2 text-sm" value={memberRole} onChange={(event) => setMemberRole(event.target.value)}><option value="member">{tCommon("member")}</option><option value="admin">{tCommon("admin")}</option></select><Button type="button" size="sm" onClick={() => void addMember(organization.id)} disabled={!memberEmail.trim()}>{tCommon("add")}</Button></div>}
                    </div>
                    <div className="space-y-3">
                      <div className="text-sm font-semibold">{t("teams")}</div>
                      {(teams[organization.id] ?? []).map((team) => {
                        const available = (members[organization.id] ?? []).filter((member) => !team.members.some((teamMember) => teamMember.user.id === member.user.id));
                        return <div key={team.id} className="space-y-2 rounded-lg border px-3 py-2 text-sm">
                          <div><span className="font-medium">{team.name}</span><span className="ml-2 text-xs text-muted-foreground">{t("teamMembers", { count: team.members.length })}</span></div>
                          {team.members.length > 0 && <p className="text-xs text-muted-foreground">{team.members.map((member) => member.user.name || member.user.email).join(", ")}</p>}
                          {canManage && available.length > 0 && <div className="flex gap-2"><select className="min-w-0 flex-1 rounded-md border bg-background px-2 text-xs" value={teamMemberSelection[team.id] ?? ""} onChange={(event) => setTeamMemberSelection((value) => ({ ...value, [team.id]: event.target.value }))}><option value="">{t("selectMember")}</option>{available.map((member) => <option key={member.user.id} value={member.user.id}>{member.user.name || member.user.email}</option>)}</select><Button type="button" size="sm" variant="outline" onClick={() => void addTeamMember(organization.id, team.id)} disabled={!teamMemberSelection[team.id]}>{tCommon("add")}</Button></div>}
                        </div>;
                      })}
                      {canManage && <div className="flex gap-2"><Input value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder={t("teamName")} /><Button type="button" size="sm" onClick={() => void addTeam(organization.id)} disabled={!teamName.trim()}>{tCommon("create")}</Button></div>}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <Dialog open={Boolean(movingBoard)} onOpenChange={(open) => { if (!open && !moving) setMovingBoard(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("moveTitle", { title: movingBoard?.board.title ?? "" })}</DialogTitle>
            <DialogDescription>{moveStep === "select" ? t("moveSelectHint") : t("moveConfirmHint")}</DialogDescription>
          </DialogHeader>
          {movingBoard && moveStep === "select" ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <div className="text-xs text-muted-foreground">{t("movingFrom")}</div>
                <div className="font-medium">{movingBoard.source.name}</div>
              </div>
              <label className="block space-y-1.5 text-sm font-medium">{t("destination")}<select className="h-10 w-full rounded-md border bg-background px-3 font-normal" value={destinationId} onChange={(event) => setDestinationId(event.target.value)}>{organizations.filter((organization) => organization.id !== movingBoard.source.id && (organization.role === "owner" || organization.role === "admin")).map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></label>
              <div className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 dark:bg-amber-950/20 dark:text-amber-100"><AlertTriangle size={16} className="shrink-0" /><p>{t("moveImpact")}</p></div>
              <DialogFooter><Button type="button" onClick={() => setMoveStep("confirm")} disabled={!destinationId}>{t("reviewMove")}</Button></DialogFooter>
            </div>
          ) : movingBoard ? (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 text-sm"><span className="text-muted-foreground">{movingBoard.source.name}</span><ArrowRightLeft className="mx-2 inline" size={14} /><span className="font-medium">{organizations.find((organization) => organization.id === destinationId)?.name}</span></div>
              <label className="block space-y-1.5 text-sm font-medium">{t("typeToConfirm", { text: `MOVE ${movingBoard.board.title}` })}<Input value={moveConfirmation} onChange={(event) => setMoveConfirmation(event.target.value)} autoComplete="off" /></label>
              <DialogFooter><Button type="button" variant="outline" onClick={() => { setMoveStep("select"); setMoveConfirmation(""); }} disabled={moving}>{tCommon("back")}</Button><Button type="button" variant="destructive" onClick={() => void moveBoard()} disabled={moving || moveConfirmation !== `MOVE ${movingBoard.board.title}`}>{moving && <Loader2 className="mr-2 animate-spin" size={16} />}{t("confirmMove")}</Button></DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
