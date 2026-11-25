-- Append-only legal consent & acceptance log (UAE PDPL, EU GDPR Art. 7(1), Swiss nLPD, US CAN-SPAM/TCPA).
-- No foreign keys: legal proof must survive account deletion. UPDATE and DELETE are blocked by trigger.
CREATE TABLE IF NOT EXISTS "LegalConsentLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "email" TEXT,
  "consentType" TEXT NOT NULL,
  "granted" BOOLEAN NOT NULL,
  "documentVersion" TEXT NOT NULL,
  "checkboxText" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LegalConsentLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LegalConsentLog_userId_createdAt_idx" ON "LegalConsentLog"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "LegalConsentLog_email_createdAt_idx" ON "LegalConsentLog"("email", "createdAt");
CREATE INDEX IF NOT EXISTS "LegalConsentLog_consentType_createdAt_idx" ON "LegalConsentLog"("consentType", "createdAt");

-- Reject any change to existing rows. Only INSERT is allowed.
CREATE OR REPLACE FUNCTION legal_consent_log_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'LegalConsentLog is append-only (% not allowed)', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS legal_consent_log_no_update_delete ON "LegalConsentLog";
CREATE TRIGGER legal_consent_log_no_update_delete
  BEFORE UPDATE OR DELETE ON "LegalConsentLog"
  FOR EACH ROW EXECUTE FUNCTION legal_consent_log_append_only();
