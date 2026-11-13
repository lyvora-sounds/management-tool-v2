-- Append-only security & administrative audit log (ISO 27001 A.8.15 / A.8.16).
-- No foreign keys: audit records must survive the deletion of users, tickets, boards, or organizations.
CREATE TABLE IF NOT EXISTS "SecurityAuditLog" (
  "id" TEXT NOT NULL,
  "boardId" TEXT,
  "organizationId" TEXT,
  "actorId" TEXT,
  "actorEmail" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "beforeState" JSONB,
  "afterState" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SecurityAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SecurityAuditLog_boardId_createdAt_idx" ON "SecurityAuditLog"("boardId", "createdAt");
CREATE INDEX IF NOT EXISTS "SecurityAuditLog_organizationId_createdAt_idx" ON "SecurityAuditLog"("organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "SecurityAuditLog_actorId_createdAt_idx" ON "SecurityAuditLog"("actorId", "createdAt");
CREATE INDEX IF NOT EXISTS "SecurityAuditLog_action_createdAt_idx" ON "SecurityAuditLog"("action", "createdAt");

-- Reject any change to existing rows. Only INSERT is allowed.
CREATE OR REPLACE FUNCTION security_audit_log_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'SecurityAuditLog is append-only (% not allowed)', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS security_audit_log_no_update_delete ON "SecurityAuditLog";
CREATE TRIGGER security_audit_log_no_update_delete
  BEFORE UPDATE OR DELETE ON "SecurityAuditLog"
  FOR EACH ROW EXECUTE FUNCTION security_audit_log_append_only();
