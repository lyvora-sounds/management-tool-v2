import { randomBytes } from "node:crypto";
import { Prisma } from "@/lib/generated/prisma/client";
import db from "@/lib/db";
import { requireOrganizationManager, requireOrganizationMember } from "@/lib/organizations";
import {
  type GithubAccountType,
  type GithubAppConfig,
  type GithubInstallation,
  type GithubWebhookEffect,
  GithubAppError,
  fetchGithubInstallation,
  githubInstallationSettingsUrl,
  uninstallGithubInstallation,
} from "@/lib/integrations/githubApp";

const RESULT_TTL_MS = 10 * 60 * 1000;
const OPEN_ATTEMPT_TTL_MS = 10 * 60 * 1000;
const REQUEST_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const RESULT_TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,128}$/;

export const GITHUB_SETUP_OUTCOMES = ["connected", "error", "requested", "updated", "waiting", "choose"] as const;
export type GithubSetupOutcome = (typeof GITHUB_SETUP_OUTCOMES)[number];

export type GithubInstallChoice = {
  installationId: string;
  accountLogin: string;
  accountType: GithubAccountType;
};

export type GithubConnectionView = {
  accountLogin: string;
  accountType: GithubAccountType;
  repositoryId: string | null;
  repositoryName: string | null;
  branch: string | null;
  settingsUrl?: string;
};

export async function githubActor(clerkId: string | null) {
  if (!clerkId) return null;
  return db.user.findUnique({ where: { clerkId }, select: { id: true } });
}

export async function canReadGithub(userId: string, organizationId: string) {
  return requireOrganizationMember(userId, organizationId);
}

export async function canManageGithub(userId: string, organizationId: string) {
  return requireOrganizationManager(userId, organizationId);
}

export async function githubConnectionView(
  organizationId: string,
  options: { includeSettingsUrl?: boolean } = {},
): Promise<GithubConnectionView | null> {
  const row = await db.organizationGithubConnection.findUnique({ where: { organizationId } });
  if (!row) return null;
  if (row.accountType !== "Organization" && row.accountType !== "User") return null;
  return {
    accountLogin: row.accountLogin,
    accountType: row.accountType,
    repositoryId: row.repositoryId,
    repositoryName: row.repositoryName,
    branch: row.branch,
    ...(options.includeSettingsUrl
      ? { settingsUrl: githubInstallationSettingsUrl(row.accountType, row.accountLogin, row.installationId) }
      : {}),
  };
}

export function installationClaimBlock(input: {
  installationId: string;
  userInstallationIds: string[];
  retired: boolean;
  takenOrganizationId: string | null;
  organizationId: string;
}): "ok" | "unproven" | "retired" | "taken" {
  if (!input.userInstallationIds.includes(input.installationId)) return "unproven";
  if (input.retired) return "retired";
  if (input.takenOrganizationId && input.takenOrganizationId !== input.organizationId) return "taken";
  return "ok";
}

export async function saveGithubInstallation(
  input: { organizationId: string; userId: string; installation: GithubInstallation },
  config: GithubAppConfig | null,
) {
  if (await db.retiredGithubInstallation.findUnique({ where: { installationId: input.installation.id } })) {
    return { ok: false as const };
  }
  const taken = await db.organizationGithubConnection.findUnique({
    where: { installationId: input.installation.id },
  });
  if (taken && taken.organizationId !== input.organizationId) return { ok: false as const };

  const current = await db.organizationGithubConnection.findUnique({
    where: { organizationId: input.organizationId },
  });
  const previousId = current && current.installationId !== input.installation.id
    ? current.installationId
    : null;
  const sameAccount = current?.accountId === input.installation.accountId
    && current.installationId === input.installation.id;
  try {
    await db.$transaction(async (tx) => {
      if (previousId) {
        await tx.retiredGithubInstallation.upsert({
          where: { installationId: previousId },
          create: { installationId: previousId },
          update: {},
        });
      }
      await tx.organizationGithubConnection.upsert({
        where: { organizationId: input.organizationId },
        create: {
          organizationId: input.organizationId,
          installationId: input.installation.id,
          accountLogin: input.installation.accountLogin,
          accountType: input.installation.accountType,
          accountId: input.installation.accountId,
          connectedById: input.userId,
        },
        update: {
          installationId: input.installation.id,
          accountLogin: input.installation.accountLogin,
          accountType: input.installation.accountType,
          accountId: input.installation.accountId,
          connectedById: input.userId,
          ...(sameAccount ? {} : { repositoryId: null, repositoryName: null, branch: null }),
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false as const };
    }
    throw error;
  }
  if (previousId && config) {
    try {
      await uninstallGithubInstallation(config, previousId);
    } catch {
      // The new row is already committed and the old id is retired, so it cannot be claimed.
    }
  }
  return { ok: true as const };
}

export async function saveGithubSelection(
  organizationId: string,
  selection: { repositoryId: string; repositoryName: string; branch: string },
) {
  return db.organizationGithubConnection.update({
    where: { organizationId },
    data: selection,
  });
}

export async function clearGithubConnection(organizationId: string, config: GithubAppConfig | null) {
  const current = await db.organizationGithubConnection.findUnique({ where: { organizationId } });
  if (!current) return;
  if (!config) throw new GithubAppError("GitHub App is not configured", 503);
  await uninstallGithubInstallation(config, current.installationId);
  await db.$transaction([
    db.retiredGithubInstallation.upsert({
      where: { installationId: current.installationId },
      create: { installationId: current.installationId },
      update: {},
    }),
    db.organizationGithubConnection.deleteMany({ where: { organizationId } }),
  ]);
}

export async function applyGithubWebhookEffect(effect: GithubWebhookEffect) {
  if (effect.action === "delete") {
    await db.organizationGithubConnection.deleteMany({ where: { installationId: effect.installationId } });
  }
  if (effect.action === "repositories-removed" && effect.repositoryIds.length > 0) {
    await db.organizationGithubConnection.updateMany({
      where: { installationId: effect.installationId, repositoryId: { in: effect.repositoryIds } },
      data: { repositoryId: null, repositoryName: null, branch: null },
    });
  }
}

export async function githubInstallationForOrganization(organizationId: string) {
  return db.organizationGithubConnection.findUnique({ where: { organizationId } });
}

export async function supersedeGithubAttempts(organizationId: string) {
  await db.organizationGithubInstallAttempt.updateMany({
    where: { organizationId, status: { in: ["open", "requested", "authorizing", "choosing"] } },
    data: { status: "consumed", codeVerifier: null, choices: Prisma.DbNull },
  });
}

export async function createGithubAttempt(input: {
  organizationId: string;
  userId: string;
  status: "open" | "authorizing";
  codeVerifier?: string | null;
}) {
  const nonce = randomBytes(32).toString("base64url");
  return db.organizationGithubInstallAttempt.create({
    data: {
      nonce,
      organizationId: input.organizationId,
      userId: input.userId,
      status: input.status,
      codeVerifier: input.codeVerifier ?? null,
      expiresAt: new Date(Date.now() + OPEN_ATTEMPT_TTL_MS),
    },
  });
}

export async function consumeGithubAttempt(id: string) {
  await db.organizationGithubInstallAttempt.update({
    where: { id },
    data: { status: "consumed", codeVerifier: null, choices: Prisma.DbNull },
  });
}

export async function markGithubAttemptRequested(id: string) {
  await db.organizationGithubInstallAttempt.update({
    where: { id },
    data: {
      status: "requested",
      expiresAt: new Date(Date.now() + REQUEST_TTL_MS),
      codeVerifier: null,
      candidateInstallationId: null,
      choices: Prisma.DbNull,
    },
  });
}

export async function markGithubAttemptAuthorizing(
  id: string,
  candidateInstallationId: string | null,
  codeVerifier: string,
) {
  await db.organizationGithubInstallAttempt.update({
    where: { id },
    data: {
      status: "authorizing",
      candidateInstallationId,
      codeVerifier,
      expiresAt: new Date(Date.now() + OPEN_ATTEMPT_TTL_MS),
    },
  });
}

export async function markGithubAttemptChoosing(id: string, choices: GithubInstallChoice[]) {
  await db.organizationGithubInstallAttempt.update({
    where: { id },
    data: { status: "choosing", choices, codeVerifier: null },
  });
}

export async function rememberGithubResult(
  userId: string,
  organizationId: string | null,
  outcome: GithubSetupOutcome,
) {
  const token = randomBytes(32).toString("base64url");
  await db.organizationGithubSetupResult.create({
    data: {
      token,
      userId,
      organizationId,
      outcome,
      expiresAt: new Date(Date.now() + RESULT_TTL_MS),
    },
  });
  return token;
}

export async function readGithubResult(token: string, userId: string) {
  if (!RESULT_TOKEN_PATTERN.test(token)) return null;
  const row = await db.organizationGithubSetupResult.findUnique({ where: { token } });
  if (!row || row.userId !== userId || row.consumedAt || row.expiresAt.getTime() <= Date.now()) return null;
  if (!(GITHUB_SETUP_OUTCOMES as readonly string[]).includes(row.outcome)) return null;
  return {
    outcome: row.outcome as GithubSetupOutcome,
    organizationId: row.organizationId,
  };
}

export async function consumeGithubResult(token: string, userId: string) {
  if (!RESULT_TOKEN_PATTERN.test(token)) return null;
  const claimed = await db.organizationGithubSetupResult.updateMany({
    where: { token, userId, consumedAt: null, expiresAt: { gt: new Date() } },
    data: { consumedAt: new Date() },
  });
  if (claimed.count !== 1) return null;
  const row = await db.organizationGithubSetupResult.findUnique({ where: { token } });
  if (!row || !(GITHUB_SETUP_OUTCOMES as readonly string[]).includes(row.outcome)) return null;
  return {
    outcome: row.outcome as GithubSetupOutcome,
    organizationId: row.organizationId,
  };
}

export function readGithubChoices(value: unknown): GithubInstallChoice[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const choice = item as { installationId?: unknown; accountLogin?: unknown; accountType?: unknown };
    if (typeof choice.installationId !== "string" || !/^\d{1,20}$/.test(choice.installationId)) return [];
    if (typeof choice.accountLogin !== "string" || choice.accountLogin.length === 0) return [];
    if (choice.accountType !== "Organization" && choice.accountType !== "User") return [];
    return [{
      installationId: choice.installationId,
      accountLogin: choice.accountLogin,
      accountType: choice.accountType,
    }];
  });
}

export async function githubInstallProgress(organizationId: string, userId: string) {
  const now = new Date();
  const [pending, choosing] = await Promise.all([
    db.organizationGithubInstallAttempt.findFirst({
      where: { organizationId, status: "requested", expiresAt: { gt: now } },
      select: { id: true },
    }),
    db.organizationGithubInstallAttempt.findFirst({
      where: { organizationId, userId, status: "choosing", expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return {
    pendingApproval: Boolean(pending),
    choices: readGithubChoices(choosing?.choices),
  };
}

export async function refreshOwnedGithubInstallation(
  config: GithubAppConfig,
  installationId: string,
  userId: string,
) {
  const current = await db.organizationGithubConnection.findUnique({ where: { installationId } });
  if (!current || !(await canManageGithub(userId, current.organizationId))) return { ok: false as const };
  const installation = await fetchGithubInstallation(config, installationId);
  if (installation.id !== current.installationId) return { ok: false as const };
  await db.organizationGithubConnection.update({
    where: { organizationId: current.organizationId },
    data: {
      accountLogin: installation.accountLogin,
      accountType: installation.accountType,
      accountId: installation.accountId,
    },
  });
  return { ok: true as const, organizationId: current.organizationId };
}
