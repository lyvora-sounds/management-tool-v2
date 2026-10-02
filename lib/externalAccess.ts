import { createHash, randomBytes } from "node:crypto";
import db from "@/lib/db";

export const TICKETS_READ_SCOPE = "tickets:read";
const TOKEN_PREFIX = "kiki_";

export type ExternalAccessContext = {
  tokenId: string;
  organizationId: string;
  boardId: string | null;
  boardTitle: string | null;
  scopes: string[];
};

export type TokenRequest = {
  name: string;
  expiresAt: Date | null;
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

export function readTokenRequest(body: unknown): TokenRequest | { error: string } {
  const record = body && typeof body === "object" && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {};
  const name = typeof record.name === "string" ? record.name.trim() : "";
  if (!name || name.length > 80) {
    return { error: "Name must contain 1 to 80 characters" };
  }

  if (record.expiresAt == null || record.expiresAt === "") {
    return { name, expiresAt: null };
  }
  const expiresAt = new Date(String(record.expiresAt));
  if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
    return { error: "Expiration must be a future date" };
  }
  return { name, expiresAt };
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
      organizationId: true,
      boardId: true,
      scopes: true,
      expiresAt: true,
      revokedAt: true,
      board: { select: { title: true, organizationId: true } },
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

  if (credential.boardId) {
    if (!credential.board || credential.board.organizationId !== credential.organizationId) {
      return null;
    }
  }

  return {
    tokenId: credential.id,
    organizationId: credential.organizationId,
    boardId: credential.boardId,
    boardTitle: credential.board?.title ?? null,
    scopes: credential.scopes,
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
