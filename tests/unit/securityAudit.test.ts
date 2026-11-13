import { describe, expect, it, vi } from "vitest";
import {
  extractRequestAuditMeta,
  getSecurityAuditLogs,
  recordSecurityAuditLog,
  sanitizeAuditState,
} from "@/lib/securityAudit";

describe("securityAudit engine (ISO 27001 A.8.15 & A.8.16)", () => {
  it("scrubs sensitive keys and bearer/token strings recursively from audit states", () => {
    const raw = {
      role: "ADMIN",
      apiKey: "sk-1234567890abcdef",
      nested: {
        webhookUrl: "https://hooks.slack.com/services/T00/B00/X00",
        clientSecret: "top-secret",
        authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc.def",
        rawTokenValue: "kiki_pat_secret12345",
        safeField: "visible-value",
      },
    };

    const scrubbed = sanitizeAuditState(raw) as Record<string, unknown>;
    expect(scrubbed.role).toBe("ADMIN");
    expect(scrubbed.apiKey).toBe("[REDACTED]");
    const nested = scrubbed.nested as Record<string, unknown>;
    expect(nested.webhookUrl).toBe("[REDACTED]");
    expect(nested.clientSecret).toBe("[REDACTED]");
    expect(nested.authorization).toBe("[REDACTED]");
    expect(nested.rawTokenValue).toBe("[REDACTED]");
    expect(nested.safeField).toBe("visible-value");
  });

  it("extracts client IP and User-Agent from request headers", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.42, 10.0.0.1",
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)",
    });

    const meta = extractRequestAuditMeta(headers);
    expect(meta).toEqual({
      ipAddress: "203.0.113.42",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)",
    });
  });

  it("persists sanitized SecurityAuditLog entries and queries them with filters", async () => {
    const stored: Array<Record<string, unknown>> = [];
    const mockDb = {
      securityAuditLog: {
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          const row = {
            id: `audit_${stored.length + 1}`,
            boardId: data.boardId ?? null,
            organizationId: data.organizationId ?? null,
            actorId: data.actorId ?? null,
            actorEmail: data.actorEmail ?? null,
            ipAddress: data.ipAddress ?? null,
            userAgent: data.userAgent ?? null,
            action: data.action,
            entityType: data.entityType,
            entityId: data.entityId ?? null,
            beforeState: data.beforeState ?? null,
            afterState: data.afterState ?? null,
            createdAt: new Date("2026-11-13T12:00:00.000Z"),
          };
          stored.push(row);
          return row;
        }),
        findMany: vi.fn(async () => stored),
      },
    } as unknown as Parameters<typeof recordSecurityAuditLog>[0];

    await recordSecurityAuditLog(mockDb, {
      boardId: "board_1",
      actorId: "user_1",
      actorEmail: "daniel@kikiboard.xyz",
      ipAddress: "198.51.100.7",
      userAgent: "KikiTest/1.0",
      action: "ROLE_CHANGED",
      entityType: "BOARD_MEMBER",
      entityId: "member_99",
      beforeState: { role: "MEMBER", secretToken: "should-not-leak" },
      afterState: { role: "ADMIN" },
    });

    await expect(getSecurityAuditLogs(mockDb, {})).rejects.toThrow(/boardId or organizationId/);

    const logs = await getSecurityAuditLogs(mockDb, { boardId: "board_1" });
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe("ROLE_CHANGED");
    expect(logs[0]?.ipAddress).toBe("198.51.100.7");
    expect(logs[0]?.beforeState).toEqual({
      role: "MEMBER",
      secretToken: "[REDACTED]",
    });
    expect(logs[0]?.afterState).toEqual({
      role: "ADMIN",
    });
  });
});
