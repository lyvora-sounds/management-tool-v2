"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AlertTriangle, ArrowRightLeft, Building2, Check, ChevronDown, ChevronRight, ChevronsUpDown, FolderKanban, Loader2, Plus, Search, Trash2, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CreateBoardModal } from "../components/boards/CreateBoardModal/CreateBoardModal";
import { useBoardPolling } from "@/hooks/use-board-polling";

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
type AvailablePerson = Member["user"] & { organizations: { id: string; name: string }[] };
type Team = { id: string; name: string; members: { user: Member["user"] }[]; boardAccess: { role: string; board: { id: string; title: string } }[] };

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
  const [availablePeople, setAvailablePeople] = useState<Record<string, AvailablePerson[]>>({});
  const [memberEmail, setMemberEmail] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
  const [searchingPeople, setSearchingPeople] = useState(false);
  const [memberRole, setMemberRole] = useState("member");
  const [updatingMember, setUpdatingMember] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [teamMemberSelection, setTeamMemberSelection] = useState<Record<string, string>>({});
  const [teamBoardSelection, setTeamBoardSelection] = useState<Record<string, string>>({});
  const [teamBoardRole, setTeamBoardRole] = useState<Record<string, string>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [movingBoard, setMovingBoard] = useState<{ board: Board; source: Organization } | null>(null);
  const [destinationId, setDestinationId] = useState("");
  const [moveStep, setMoveStep] = useState<"select" | "confirm">("select");
  const [moveConfirmation, setMoveConfirmation] = useState("");
  const [moving, setMoving] = useState(false);

  const loadOrganizations = useCallback(async () => {
    const response = await fetch("/api/organizations", { cache: "no-store" });
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

  useEffect(() => {
    if (!expanded) return;
    const timer = window.setTimeout(() => {
      setSearchingPeople(true);
      fetch(`/api/organizations/${expanded}/available-members?q=${encodeURIComponent(memberSearch)}`)
        .then(async (response) => response.ok ? response.json() : [])
        .then((people) => setAvailablePeople((value) => ({ ...value, [expanded]: people })))
        .finally(() => setSearchingPeople(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [expanded, memberSearch]);

  const loadDetails = useCallback(async (organizationId: string, search = "") => {
    const [membersResponse, teamsResponse, peopleResponse] = await Promise.all([
      fetch(`/api/organizations/${organizationId}/members`, { cache: "no-store" }),
      fetch(`/api/organizations/${organizationId}/teams`, { cache: "no-store" }),
      fetch(`/api/organizations/${organizationId}/available-members?q=${encodeURIComponent(search)}`, { cache: "no-store" }),
    ]);
    if ([membersResponse, teamsResponse, peopleResponse].some((response) => response.status >= 500)) {
      throw new Error("Unable to load organization details");
    }
    const memberData = membersResponse.ok ? await membersResponse.json() : [];
    const teamData = teamsResponse.ok ? await teamsResponse.json() : [];
    const peopleData = peopleResponse.ok ? await peopleResponse.json() : [];
    setMembers((value) => ({ ...value, [organizationId]: memberData }));
    setTeams((value) => ({ ...value, [organizationId]: teamData }));
    setAvailablePeople((value) => ({ ...value, [organizationId]: peopleData }));
  }, []);

  const refreshOrganizations = useCallback(async () => {
    await Promise.all([
      loadOrganizations(),
      ...(expanded ? [loadDetails(expanded, memberSearch)] : []),
    ]);
  }, [expanded, memberSearch, loadDetails, loadOrganizations]);

  useBoardPolling(refreshOrganizations);

  const toggle = async (organizationId: string) => {
    const next = expanded === organizationId ? null : organizationId;
    setExpanded(next);
    if (next) await loadDetails(next);
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
      setMemberSearch("");
      setMemberPickerOpen(false);
      await Promise.all([loadDetails(organizationId), loadOrganizations()]);
      toast.success(t("memberAdded"));
    } else {
      const data = await response.json().catch(() => null);
      toast.error(data?.error ?? t("memberError"));
    }
  };

  const updateMemberRole = async (organizationId: string, userId: string, role: "admin" | "member") => {
    setUpdatingMember(userId);
    const response = await fetch(`/api/organizations/${organizationId}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    if (response.ok) {
      await Promise.all([loadDetails(organizationId), loadOrganizations()]);
      toast.success(t("memberRoleUpdated"));
    } else {
      const data = await response.json().catch(() => null);
      toast.error(data?.error ?? t("memberRoleError"));
    }
    setUpdatingMember(null);
  };

  const removeMember = async (organizationId: string, member: Member) => {
    const displayName = member.user.name || member.user.email;
    if (!window.confirm(t("removeMemberConfirm", { name: displayName }))) return;
    setUpdatingMember(member.user.id);
    const response = await fetch(`/api/organizations/${organizationId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: member.user.id }),
    });
    if (response.ok) {
      await Promise.all([loadDetails(organizationId), loadOrganizations()]);
      toast.success(t("memberRemoved"));
    } else {
      const data = await response.json().catch(() => null);
      toast.error(data?.error ?? t("memberRemoveError"));
    }
    setUpdatingMember(null);
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

  const assignTeamToBoard = async (organizationId: string, teamId: string) => {
    const boardId = teamBoardSelection[teamId];
    if (!boardId) return;
    const response = await fetch(`/api/organizations/${organizationId}/teams/${teamId}/boards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boardId, role: teamBoardRole[teamId] ?? "member" }),
    });
    if (response.ok) {
      await loadDetails(organizationId);
      setTeamBoardSelection((value) => ({ ...value, [teamId]: "" }));
      toast.success(t("teamAssigned"));
    } else toast.error(t("teamAssignError"));
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
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><FolderKanban size={14} />{t("boards")}</div>
                    <CreateBoardModal organizationId={organization.id} onCreated={loadOrganizations} />
                  </div>
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
                      {(members[organization.id] ?? []).map((member) => {
                        const canEditMember = canManage && member.role !== "owner" && (organization.role === "owner" || member.role !== "admin");
                        const isUpdating = updatingMember === member.user.id;
                        return (
                          <div key={member.user.id} className="flex items-center justify-between gap-3 text-sm">
                            <div className="min-w-0 flex-1"><p className="truncate font-medium">{member.user.name || t("unnamedMember")}</p><p className="truncate text-xs text-muted-foreground">{member.user.email}</p></div>
                            {canEditMember ? (
                              <div className="flex shrink-0 items-center gap-2">
                                <select
                                  className="h-8 rounded-md border bg-background px-2 text-xs"
                                  value={member.role}
                                  disabled={isUpdating}
                                  aria-label={t("memberRole", { name: member.user.name || member.user.email })}
                                  onChange={(event) => void updateMemberRole(organization.id, member.user.id, event.target.value as "admin" | "member")}
                                >
                                  <option value="member">{tCommon("member")}</option>
                                  <option value="admin">{tCommon("admin")}</option>
                                </select>
                                <Button
                                  type="button"
                                  size="icon-sm"
                                  variant="ghost"
                                  disabled={isUpdating}
                                  onClick={() => void removeMember(organization.id, member)}
                                  aria-label={t("removeMember", { name: member.user.name || member.user.email })}
                                  title={t("removeMember", { name: member.user.name || member.user.email })}
                                >
                                  {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                </Button>
                              </div>
                            ) : <Badge variant="outline">{member.role}</Badge>}
                          </div>
                        );
                      })}
                      {canManage && (
                        <div className="space-y-2 rounded-xl border bg-muted/20 p-3">
                          <div className="text-xs font-medium">{t("addExistingMember")}</div>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Popover open={memberPickerOpen} onOpenChange={setMemberPickerOpen}>
                              <PopoverTrigger
                                render={
                                  <Button type="button" variant="outline" className="min-w-0 flex-1 justify-between bg-background font-normal" />
                                }
                              >
                                <span className="truncate">
                                  {memberEmail
                                    ? (() => {
                                        const person = (availablePeople[organization.id] ?? []).find((item) => item.email === memberEmail);
                                        return person ? `${person.name || t("unnamedMember")} · ${person.email}` : memberEmail;
                                      })()
                                    : t("selectPerson")}
                                </span>
                                <ChevronsUpDown className="ml-2 shrink-0 text-muted-foreground" size={15} />
                              </PopoverTrigger>
                              <PopoverContent align="start" className="w-[min(34rem,calc(100vw-2rem))] gap-2 rounded-xl p-2">
                                <div className="flex items-center gap-2 rounded-lg border bg-background px-3 focus-within:ring-2 focus-within:ring-ring/40">
                                  <Search size={15} className="shrink-0 text-muted-foreground" />
                                  <input
                                    value={memberSearch}
                                    onChange={(event) => setMemberSearch(event.target.value)}
                                    placeholder={t("searchPeople")}
                                    className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                                    autoFocus
                                  />
                                  {searchingPeople && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
                                </div>
                                <div className="max-h-72 overflow-y-auto rounded-lg">
                                  {(availablePeople[organization.id] ?? []).map((person) => (
                                    <button
                                      key={person.id}
                                      type="button"
                                      onClick={() => {
                                        setMemberEmail(person.email);
                                        setMemberPickerOpen(false);
                                      }}
                                      className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:outline-none"
                                    >
                                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                        {(person.name || person.email).slice(0, 2).toUpperCase()}
                                      </span>
                                      <span className="min-w-0 flex-1">
                                        <span className="flex items-center gap-2 font-medium"><span className="truncate">{person.name || t("unnamedMember")}</span>{memberEmail === person.email && <Check size={14} className="text-primary" />}</span>
                                        <span className="block truncate text-xs text-muted-foreground">{person.email}</span>
                                        <span className="mt-1 flex flex-wrap gap-1">{person.organizations.map((item) => <Badge key={item.id} variant="secondary" className="text-[10px]">{item.name}</Badge>)}</span>
                                      </span>
                                    </button>
                                  ))}
                                  {!searchingPeople && (availablePeople[organization.id] ?? []).length === 0 && <p className="px-3 py-8 text-center text-xs text-muted-foreground">{memberSearch ? t("noSearchResults") : t("noAvailablePeople")}</p>}
                                </div>
                                <p className="px-2 text-[10px] text-muted-foreground">{t("searchLimit")}</p>
                              </PopoverContent>
                            </Popover>
                            <select className="h-9 rounded-md border bg-background px-2 text-sm" value={memberRole} onChange={(event) => setMemberRole(event.target.value)}><option value="member">{tCommon("member")}</option><option value="admin">{tCommon("admin")}</option></select>
                            <Button type="button" size="sm" onClick={() => void addMember(organization.id)} disabled={!memberEmail}>{tCommon("add")}</Button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="text-sm font-semibold">{t("teams")}</div>
                      {(teams[organization.id] ?? []).map((team) => {
                        const available = (members[organization.id] ?? []).filter((member) => !team.members.some((teamMember) => teamMember.user.id === member.user.id));
                        return <div key={team.id} className="space-y-2 rounded-lg border px-3 py-2 text-sm">
                          <div><span className="font-medium">{team.name}</span><span className="ml-2 text-xs text-muted-foreground">{t("teamMembers", { count: team.members.length })}</span></div>
                          {team.members.length > 0 && <p className="text-xs text-muted-foreground">{team.members.map((member) => member.user.name || member.user.email).join(", ")}</p>}
                          {team.boardAccess.length > 0 && <div className="flex flex-wrap gap-1">{team.boardAccess.map((grant) => <Badge key={grant.board.id} variant="secondary">{grant.board.title} · {grant.role}</Badge>)}</div>}
                          {canManage && available.length > 0 && <div className="flex gap-2"><select className="min-w-0 flex-1 rounded-md border bg-background px-2 text-xs" value={teamMemberSelection[team.id] ?? ""} onChange={(event) => setTeamMemberSelection((value) => ({ ...value, [team.id]: event.target.value }))}><option value="">{t("selectMember")}</option>{available.map((member) => <option key={member.user.id} value={member.user.id}>{member.user.name || member.user.email}</option>)}</select><Button type="button" size="sm" variant="outline" onClick={() => void addTeamMember(organization.id, team.id)} disabled={!teamMemberSelection[team.id]}>{tCommon("add")}</Button></div>}
                          {canManage && organization.boards.some((board) => !team.boardAccess.some((grant) => grant.board.id === board.id)) && <div className="flex gap-2"><select className="min-w-0 flex-1 rounded-md border bg-background px-2 text-xs" value={teamBoardSelection[team.id] ?? ""} onChange={(event) => setTeamBoardSelection((value) => ({ ...value, [team.id]: event.target.value }))}><option value="">{t("selectBoard")}</option>{organization.boards.filter((board) => !team.boardAccess.some((grant) => grant.board.id === board.id)).map((board) => <option key={board.id} value={board.id}>{board.title}</option>)}</select><select className="rounded-md border bg-background px-2 text-xs" value={teamBoardRole[team.id] ?? "member"} onChange={(event) => setTeamBoardRole((value) => ({ ...value, [team.id]: event.target.value }))}><option value="viewer">{t("viewer")}</option><option value="member">{tCommon("member")}</option><option value="admin">{tCommon("admin")}</option></select><Button type="button" size="sm" variant="outline" onClick={() => void assignTeamToBoard(organization.id, team.id)} disabled={!teamBoardSelection[team.id]}>{t("assign")}</Button></div>}
                        </div>;
                      })}
                      <div className="flex gap-2"><Input value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder={t("teamName")} /><Button type="button" size="sm" onClick={() => void addTeam(organization.id)} disabled={!teamName.trim()}>{tCommon("create")}</Button></div>
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
