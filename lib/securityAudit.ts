/** One row of a board's security audit log, as kiki-api sends it (`GET /v1/boards/:boardId/audit-logs`). */
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
