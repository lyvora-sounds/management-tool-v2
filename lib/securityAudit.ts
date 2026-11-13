import type { Prisma, PrismaClient } from "@/lib/generated/prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

export type SecurityAuditAction =
  | "MEMBER_INVITED"
  | "INVITATION_ACCEPTED"
  | "INVITATION_REVOKED"
  | "MEMBER_ADDED"
  | "ROLE_CHANGED"
  | "MEMBER_REMOVED"
  | "TICKET_DELETED"
  | "BOARD_ACCESS_UPDATED"
  | "BOARD_DELETED"
  | "INTEGRATION_TOKEN_ROTATED"
  | "MCP_TOKEN_CREATED"
  | "MCP_TOKEN_REVOKED";

export type SecurityAuditEntityType =
  | "BOARD_MEMBER"
  | "INVITATION"
  | "TASK"
  | "BOARD"
  | "INTEGRATION"
  | "MCP_TOKEN";

export interface SecurityAuditInput {
  boardId?: string | null;
  organizationId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  action: SecurityAuditAction | (string & {});
  entityType: SecurityAuditEntityType | (string & {});
  entityId?: string | null;
  beforeState?: unknown;
  afterState?: unknown;
}

const SENSITIVE_KEY_PATTERN =
  /password|secret|token|api[-_]?key|private[-_]?key|client[-_]?secret|authorization|cookie|cipher|hash|credential|bearer|webhook[-_]?url/i;

const BEARER_OR_JWT_VALUE_PATTERN =
  /^(Bearer\s+[A-Za-z0-9\-._~+/]+=*|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|kiki_[A-Za-z0-9_-]+|sk-[A-Za-z0-9_-]{12,})$/i;

/**
 * Recursively scrubs sensitive keys and secret-shaped string values from before/after audit payloads
 * so decrypted credentials, API keys, and tokens are never persisted in SecurityAuditLog (ISO 27001 A.8.15).
 */
export function sanitizeAuditState(value: unknown, depth = 0): Prisma.InputJsonValue | null {
  if (value === null || value === undefined) return null;
  if (depth > 8) return "[TRUNCATED]";

  if (typeof value === "string") {
    if (BEARER_OR_JWT_VALUE_PATTERN.test(value.trim())) {
      return "[REDACTED]";
    }
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAuditState(item, depth + 1));
  }

  if (typeof value === "object") {
    const out: Record<string, Prisma.InputJsonValue | null> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY_PATTERN.test(k)) {
        out[k] = "[REDACTED]";
      } else {
        out[k] = sanitizeAuditState(v, depth + 1);
      }
    }
    return out as Prisma.InputJsonObject;
  }

  return String(value);
}

/**
 * Extracts client IP address and User-Agent from standard Next.js / Fetch Headers or Fastify headers.
 */
export function extractRequestAuditMeta(headers?: Headers | Record<string, string | string[] | undefined> | null): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  if (!headers) {
    return { ipAddress: null, userAgent: null };
  }

  const getHeader = (name: string): string | null => {
    if (typeof (headers as Headers).get === "function") {
      return (headers as Headers).get(name);
    }
    const record = headers as Record<string, string | string[] | undefined>;
    const raw = record[name] ?? record[name.toLowerCase()];
    if (Array.isArray(raw)) return raw[0] ?? null;
    return raw ?? null;
  };

  const forwardedFor = getHeader("x-forwarded-for");
  const realIp = getHeader("x-real-ip");
  const ipAddress = forwardedFor
    ? (forwardedFor.split(",")[0]?.trim() || null)
    : (realIp?.trim() || null);
  const userAgent = getHeader("user-agent")?.trim() || null;

  return { ipAddress, userAgent };
}

/**
 * Writes an immutable SecurityAuditLog entry with automatic secret scrubbing.
 */
export async function recordSecurityAuditLog(db: DbClient, input: SecurityAuditInput) {
  const beforeState = sanitizeAuditState(input.beforeState);
  const afterState = sanitizeAuditState(input.afterState);

  return db.securityAuditLog.create({
    data: {
      boardId: input.boardId ?? null,
      organizationId: input.organizationId ?? null,
      actorId: input.actorId ?? null,
      actorEmail: input.actorEmail ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      ...(beforeState !== null ? { beforeState } : {}),
      ...(afterState !== null ? { afterState } : {}),
    },
  });
}

export interface SecurityAuditQueryOptions {
  boardId?: string;
  organizationId?: string;
  action?: string;
  actorId?: string;
  entityType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface SecurityAuditLogRecord {
  id: string;
  boardId: string | null;
  organizationId: string | null;
  actorId: string | null;
  actorEmail: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  beforeState: unknown;
  afterState: unknown;
  createdAt: string;
}

export async function getSecurityAuditLogs(
  db: DbClient,
  options: SecurityAuditQueryOptions,
): Promise<SecurityAuditLogRecord[]> {
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 500);
  const rows = await db.securityAuditLog.findMany({
    where: {
      ...(options.boardId ? { boardId: options.boardId } : {}),
      ...(options.organizationId ? { organizationId: options.organizationId } : {}),
      ...(options.action ? { action: options.action } : {}),
      ...(options.actorId ? { actorId: options.actorId } : {}),
      ...(options.entityType ? { entityType: options.entityType } : {}),
      ...(options.startDate || options.endDate
        ? {
            createdAt: {
              ...(options.startDate ? { gte: options.startDate } : {}),
              ...(options.endDate ? { lte: options.endDate } : {}),
            },
          }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
  });

  return rows.map((row) => ({
    id: row.id,
    boardId: row.boardId,
    organizationId: row.organizationId,
    actorId: row.actorId,
    actorEmail: row.actorEmail,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    beforeState: row.beforeState,
    afterState: row.afterState,
    createdAt: row.createdAt.toISOString(),
  }));
}
