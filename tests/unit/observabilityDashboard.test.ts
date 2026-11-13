import { describe, expect, it } from "vitest";
import {
  formatIsoObservabilityJsonBundle,
  formatSecurityAuditLogsCsv,
  formatStateTransitionsCsv,
} from "@/lib/metrics/exportObservability";

describe("Observability Dashboard CSV & ISO 27001 JSON Export", () => {
  it("exports state transition history to RFC-4180 compliant CSV with snapshot fields", () => {
    const csv = formatStateTransitionsCsv([
      {
        id: "tr_1",
        taskId: "task_1",
        taskTitle: 'Fix "login" flow, urgent',
        boardId: "board_1",
        fromListId: "list_todo",
        fromListTitle: "To do",
        toListId: "list_done",
        toListTitle: "Done",
        movedById: "user_1",
        movedByName: "Daniel Alvarez",
        assigneeIdAtMove: "user_1",
        assigneeNameAtMove: "Daniel Alvarez",
        storyPointsAtMove: 5,
        completedAfterMove: true,
        durationMs: 7_200_000,
        transitionedAt: "2026-11-13T10:00:00.000Z",
      },
    ]);

    const lines = csv.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("storyPointsAtMove,completedAfterMove,durationMs");
    expect(lines[1]).toContain('"Fix ""login"" flow, urgent"');
    expect(lines[1]).toContain(",5,true,7200000");
  });

  it("exports security audit logs to CSV and ISO 27001 JSON bundle", () => {
    const auditLogs = [
      {
        id: "audit_1",
        boardId: "board_1",
        organizationId: "org_1",
        actorId: "user_1",
        actorEmail: "daniel@kikiboard.xyz",
        ipAddress: "203.0.113.10",
        userAgent: "Mozilla/5.0",
        action: "ROLE_CHANGED",
        entityType: "BOARD_MEMBER",
        entityId: "member_1",
        beforeState: { role: "MEMBER" },
        afterState: { role: "ADMIN" },
        createdAt: "2026-11-13T12:00:00.000Z",
      },
    ];

    const csv = formatSecurityAuditLogsCsv(auditLogs);
    expect(csv).toContain("ROLE_CHANGED");
    expect(csv).toContain("203.0.113.10");

    const json = formatIsoObservabilityJsonBundle({
      boardId: "board_1",
      exportedAt: "2026-11-13T12:05:00.000Z",
      metrics: null,
      transitions: [],
      auditLogs,
    });
    const parsed = JSON.parse(json) as {
      schemaVersion: string;
      controls: string[];
      securityAuditLogs: unknown[];
    };
    expect(parsed.schemaVersion).toBe("iso-27001-observability/v1");
    expect(parsed.controls).toContain("ISO/IEC 27001:2022 A.8.15");
    expect(parsed.securityAuditLogs).toHaveLength(1);
  });
});
