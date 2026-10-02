import { createHash, randomBytes } from "node:crypto";
import db from "@/lib/db";

export const TICKETS_READ_SCOPE = "tickets:read";
const TOKEN_PREFIX = "kiki_";

export type ExternalAccessContext = {
  tokenId: string;
  boardId: string;
  boardTitle: string;
  scopes: string[];
  environments: string[];
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

export function allowsEnvironment(allowed: string[], environment: string | null): boolean {
  if (allowed.includes("*")) return true;
  return environment !== null && allowed.includes(environment);
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
    !credential.scopes.includes(requiredScope)
  ) {
    return null;
  }

  await db.externalAccessToken.update({
    where: { id: credential.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    tokenId: credential.id,
    boardId: credential.boardId,
    boardTitle: credential.board.title,
    scopes: credential.scopes,
    environments: credential.environments,
  };
}
