import db from "@/lib/db";

export const ORGANIZATION_ROLES = ["owner", "admin", "member"] as const;
export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];

export function isOrganizationRole(value: unknown): value is OrganizationRole {
  return typeof value === "string" && ORGANIZATION_ROLES.includes(value as OrganizationRole);
}

export function canManageOrganization(role: string | null | undefined) {
  return role === "owner" || role === "admin";
}

export async function getOrganizationRole(userId: string, organizationId: string) {
  const membership = await db.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
    select: { role: true },
  });
  return membership?.role ?? null;
}

export async function requireOrganizationManager(userId: string, organizationId: string) {
  return canManageOrganization(await getOrganizationRole(userId, organizationId));
}

export async function requireOrganizationMember(userId: string, organizationId: string) {
  return (await getOrganizationRole(userId, organizationId)) !== null;
}

export async function ensureOrganizationForBoard(
  userId: string,
  requestedOrganizationId?: string | null,
) {
  if (requestedOrganizationId) {
    if (!(await requireOrganizationMember(userId, requestedOrganizationId))) return null;
    return requestedOrganizationId;
  }

  const existing = await db.organizationMember.findFirst({
    where: { userId, role: { in: ["owner", "admin"] } },
    orderBy: { createdAt: "asc" },
    select: { organizationId: true },
  });
  if (existing) return existing.organizationId;

  const organization = await db.organization.create({
    data: {
      name: "My Organization",
      createdById: userId,
      members: { create: { userId, role: "owner" } },
    },
    select: { id: true },
  });
  return organization.id;
}
