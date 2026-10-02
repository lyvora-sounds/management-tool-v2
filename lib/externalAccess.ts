import { createHash, randomBytes } from "node:crypto";
import db from "@/lib/db";
import { ensureDefaultCustomFields } from "@/lib/ensureDefaultCustomFields";

export const TICKETS_READ_SCOPE = "tickets:read";
const TOKEN_PREFIX = "kiki_";

export type EnvironmentGrant = {
  allEnvironments: boolean;
  environments: string[];
};

export type ExternalAccessContext = EnvironmentGrant & {
  tokenId: string;
  boardId: string;
  boardTitle: string;
  scopes: string[];
};

export function hashExternalAccessToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createExternalAccessToken(): { token: string; hash: string; prefix: string } {
  const token = `${TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
  return {
    token,
    hash: hashExternalAccessToken(token),
    prefix: token.slice(0, 13),
  };
}

export function readBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const [scheme, token, ...rest] = header.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== "bearer" || !token || rest.length) return null;
  return token;
}

export function parseEnvironmentGrant(body: unknown): EnvironmentGrant | { error: string } {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const allEnvironments = record.allEnvironments === true;
  const requested = Array.isArray(record.environments)
    ? record.environments
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .map((value) => value.trim())
    : [];
  const environments = [...new Set(requested)];

  if (environments.some((environment) => environment === "*")) {
    return { error: "List environment names, or set allEnvironments to true" };
  }
  if (allEnvironments && environments.length > 0) {
    return { error: "Use either allEnvironments or an explicit environment list" };
  }
  if (!allEnvironments && environments.length === 0) {
    return { error: "Environments are required; set allEnvironments or an explicit environment list" };
  }
  return allEnvironments
    ? { allEnvironments: true, environments: [] }
    : { allEnvironments: false, environments };
}

export function allowsEnvironment(grant: EnvironmentGrant, environment: string | null): boolean {
  if (grant.allEnvironments) return true;
  return environment !== null && grant.environments.includes(environment);
}

export function environmentWhere(grant: EnvironmentGrant & { boardId: string }) {
  if (grant.allEnvironments) return {};
  return {
    customValues: {
      some: {
        customField: { boardId: grant.boardId, defaultKey: "environment" },
        value: { in: grant.environments },
      },
    },
  };
}

export async function configuredEnvironments(boardId: string): Promise<string[]> {
  await ensureDefaultCustomFields(boardId);
  const environmentField = await db.customField.findUnique({
    where: { boardId_defaultKey: { boardId, defaultKey: "environment" } },
    select: { options: true },
  });
  return Array.isArray(environmentField?.options)
    ? environmentField.options.filter((value): value is string => typeof value === "string")
    : [];
}

export async function authenticateExternalAccess(
  request: Request,
  requiredScope = TICKETS_READ_SCOPE,
): Promise<ExternalAccessContext | null> {
  const rawToken = readBearerToken(request);
  if (!rawToken?.startsWith(TOKEN_PREFIX)) return null;

  const credential = await db.externalAccessToken.findUnique({
    where: { tokenHash: hashExternalAccessToken(rawToken) },
    select: {
      id: true,
      boardId: true,
      scopes: true,
      allEnvironments: true,
      environments: true,
      expiresAt: true,
      revokedAt: true,
      board: { select: { title: true } },
    },
  });

  if (
    !credential ||
    credential.revokedAt ||
    (credential.expiresAt && credential.expiresAt <= new Date()) ||
    !credential.scopes.includes(requiredScope) ||
    (!credential.allEnvironments && credential.environments.length === 0)
  ) {
    return null;
  }

  return {
    tokenId: credential.id,
    boardId: credential.boardId,
    boardTitle: credential.board.title,
    scopes: credential.scopes,
    allEnvironments: credential.allEnvironments,
    environments: credential.allEnvironments ? [] : credential.environments,
  };
}

export async function recordExternalAccessUse(tokenId: string): Promise<void> {
  try {
    await db.externalAccessToken.update({
      where: { id: tokenId },
      data: { lastUsedAt: new Date() },
    });
  } catch {
    // A usage timestamp must not fail an authorized call.
  }
}
