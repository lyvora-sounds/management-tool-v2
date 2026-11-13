import type {
  BoardMetricsSummary,
  StateTransitionHistoryEntry,
} from "./storyPoints";
import type { SecurityAuditLogRecord } from "../securityAudit";

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str =
    typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function formatStateTransitionsCsv(
  transitions: StateTransitionHistoryEntry[],
): string {
  const headers = [
    "id",
    "transitionedAt",
    "boardId",
    "taskId",
    "taskTitle",
    "fromListId",
    "fromListTitle",
    "toListId",
    "toListTitle",
    "movedById",
    "movedByName",
    "assigneeIdAtMove",
    "assigneeNameAtMove",
    "storyPointsAtMove",
    "completedAfterMove",
    "durationMs",
  ];
  const lines = [headers.join(",")];
  for (const row of transitions) {
    lines.push(
      [
        row.id,
        row.transitionedAt,
        row.boardId,
        row.taskId,
        row.taskTitle,
        row.fromListId,
        row.fromListTitle,
        row.toListId,
        row.toListTitle,
        row.movedById,
        row.movedByName,
        row.assigneeIdAtMove,
        row.assigneeNameAtMove,
        row.storyPointsAtMove,
        row.completedAfterMove,
        row.durationMs,
      ]
        .map(escapeCsvCell)
        .join(","),
    );
  }
  return lines.join("\n");
}

export function formatSecurityAuditLogsCsv(
  logs: SecurityAuditLogRecord[],
): string {
  const headers = [
    "id",
    "createdAt",
    "boardId",
    "organizationId",
    "actorId",
    "actorEmail",
    "ipAddress",
    "userAgent",
    "action",
    "entityType",
    "entityId",
    "beforeState",
    "afterState",
  ];
  const lines = [headers.join(",")];
  for (const row of logs) {
    lines.push(
      [
        row.id,
        row.createdAt,
        row.boardId,
        row.organizationId,
        row.actorId,
        row.actorEmail,
        row.ipAddress,
        row.userAgent,
        row.action,
        row.entityType,
        row.entityId,
        row.beforeState,
        row.afterState,
      ]
        .map(escapeCsvCell)
        .join(","),
    );
  }
  return lines.join("\n");
}

export function formatIsoObservabilityJsonBundle(input: {
  boardId: string;
  exportedAt?: string;
  metrics: BoardMetricsSummary | null;
  transitions: StateTransitionHistoryEntry[];
  auditLogs: SecurityAuditLogRecord[];
}): string {
  return JSON.stringify(
    {
      schemaVersion: "iso-27001-observability/v1",
      controls: ["ISO/IEC 27001:2022 A.8.15", "ISO/IEC 27001:2022 A.8.16", "ISO/IEC 27001:2022 A.8.32"],
      boardId: input.boardId,
      exportedAt: input.exportedAt ?? new Date().toISOString(),
      metrics: input.metrics,
      stateTransitions: input.transitions,
      securityAuditLogs: input.auditLogs,
    },
    null,
    2,
  );
}
