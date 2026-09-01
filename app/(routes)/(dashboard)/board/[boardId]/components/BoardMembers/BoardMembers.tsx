"use client";

import { useEffect, useState } from "react";
import { Users, Trash2, Mail, UserCheck, Clock, Crown, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Member, Invitation, BoardOwner, Props } from "./BoardMembers.types";
import { ConfirmModal } from "@/components/Shared/ModalDeleteConfirmation/ModalDeleteConfirmation";

export function BoardMembers({ boardId, open, onClose }: Props) {
  const t = useTranslations("members");
  const tCommon = useTranslations("common");
  const [owner, setOwner] = useState<BoardOwner | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  // Gestionar el board es cosa de propietario y administradores; la propiedad
  // en sí (traspasar, borrar) sigue siendo exclusiva del propietario.
  const [canManage, setCanManage] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [confirmMember, setConfirmMember] = useState<Member | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch(`/api/boards/${boardId}/invitations`)
      .then((r) => r.json())
      .then((data) => {
        setOwner(data.owner ?? null);
        setMembers(data.members ?? []);
        setInvitations(data.invitations ?? []);
        setIsOwner(data.isOwner ?? false);
        setCanManage(data.canManage ?? false);
      });
  }, [open, boardId]);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    const res = await fetch(`/api/boards/${boardId}/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? t("inviteError"));
    } else {
      setInvitations((prev) => [data, ...prev]);
      setEmail("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setLoading(false);
  };

  const cancelInvitation = async (invitationId: string) => {
    const prev = invitations;
    setInvitations(prev.filter((i) => i.id !== invitationId));
    const res = await fetch(`/api/boards/${boardId}/invitations/${invitationId}`, {
      method: "DELETE",
    });
    if (!res.ok) setInvitations(prev);
  };

  const changeRole = async (memberId: string, role: string) => {
    const prev = members;
    setMembers((ms) => ms.map((m) => (m.id === memberId ? { ...m, role } : m)));
    const res = await fetch(`/api/boards/${boardId}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      setMembers(prev);
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? t("roleChangeError"));
    }
  };

  const removeMember = async (memberId: string) => {
    const res = await fetch(`/api/boards/${boardId}/members/${memberId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } else {
      setError(t("removeError"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users size={18} />
            {t("title")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {/* Invite form — propietario y administradores */}
          {canManage && <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">{t("inviteByEmail")}</p>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                placeholder={t("emailPlaceholder")}
                className="flex-1 rounded-md border bg-transparent px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
              />
              <Button size="sm" onClick={handleInvite} disabled={loading || !email.trim()}>
                {loading ? "..." : t("invite")}
              </Button>
            </div>
            {success && <p className="text-xs text-green-600">{t("inviteSent")}</p>}
          </div>}

          {/* Fuera del formulario: cambiar rol y expulsar también fallan, y sus
              errores quedaban invisibles para quien no ve el bloque de invitar. */}
          {error && <p className="text-xs text-destructive">{error}</p>}

          {/* Members (Including Admin/Owner) */}
          {(owner || members.length > 0) && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("membersCount", { count: (owner ? 1 : 0) + members.length })}
              </p>

              {/* Admin / Owner */}
              {owner && (
                <div className="flex items-center gap-2 rounded-md px-2 py-1.5 bg-muted/40 border border-border/50">
                  <Crown size={15} className="text-amber-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{owner.name ?? owner.email}</p>
                    {owner.name && (
                      <p className="text-xs text-muted-foreground truncate">{owner.email}</p>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-semibold shrink-0">
                    {t("owner")}
                  </Badge>
                </div>
              )}

              {/* Other Members */}
              {members.map((member) => {
                const isAdmin = member.role === "admin";
                // Un admin no puede tocar a otro admin —ni degradarlo ni
                // echarlo—: eso queda para el propietario. Es la misma regla
                // que aplican PATCH y DELETE de members/[memberId].
                const canEditMember = isOwner || (canManage && !isAdmin);

                return (
                <div key={member.id} className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted transition-colors">
                  {isAdmin ? (
                    <Shield size={15} className="text-blue-600 shrink-0" />
                  ) : (
                    <UserCheck size={15} className="text-green-600 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{member.user.name ?? member.user.email}</p>
                    {member.user.name && (
                      <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                    )}
                  </div>

                  {canEditMember ? (
                    <select
                      value={isAdmin ? "admin" : "member"}
                      onChange={(e) => changeRole(member.id, e.target.value)}
                      className="shrink-0 rounded-md border bg-transparent px-1.5 py-0.5 text-[11px] outline-none focus:ring-1 focus:ring-ring"
                      aria-label={t("roleLabel", {
                        name: member.user.name ?? member.user.email,
                      })}
                    >
                      <option value="member">{t("member")}</option>
                      <option value="admin">{t("admin")}</option>
                    </select>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground shrink-0">
                      {isAdmin ? t("admin") : t("member")}
                    </Badge>
                  )}

                  {canEditMember && (
                    <button
                      onClick={() => setConfirmMember(member)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all cursor-pointer p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                );
              })}
            </div>
          )}

          {/* Pending invitations */}
          {invitations.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("pendingInvitations")}
              </p>
              {invitations.map((inv) => (
                <div key={inv.id} className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted transition-colors">
                  <Clock size={15} className="text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{inv.email}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail size={10} /> {t("pending")}
                    </p>
                  </div>
                  {/* Revocar invitaciones es solo del propietario: al admin le
                      devolvía 404 y la fila reaparecía sin explicación. */}
                  {isOwner && (
                    <button
                      onClick={() => cancelInvitation(inv.id)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {members.length === 0 && invitations.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              {t("empty")}
            </p>
          )}
        </div>
      </DialogContent>
      <ConfirmModal
        open={!!confirmMember}
        title={t("removeTitle")}
        description={t("removeDescription", {
          name: confirmMember?.user.name ?? confirmMember?.user.email ?? "",
        })}
        confirmLabel={tCommon("delete")}
        variant="warning"
        onConfirm={() => {
          if (confirmMember) removeMember(confirmMember.id);
          setConfirmMember(null);
        }}
        onCancel={() => setConfirmMember(null)}
      />
    </Dialog>
  );
}
