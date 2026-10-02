-- An MCP credential always belongs to one organization.
-- boardId stays set for a single-board credential and becomes null for an
-- organization credential. Existing rows copy the board's organization.

ALTER TABLE "ExternalAccessToken"
  ADD COLUMN IF NOT EXISTS "organizationId" TEXT,
  ADD COLUMN IF NOT EXISTS "allEnvironments" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "environments" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "ExternalAccessToken" AS token
SET "organizationId" = board."organizationId"
FROM "Board" AS board
WHERE token."boardId" = board."id";

DELETE FROM "ExternalAccessToken" WHERE "organizationId" IS NULL;

ALTER TABLE "ExternalAccessToken" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "ExternalAccessToken" ALTER COLUMN "boardId" DROP NOT NULL;
ALTER TABLE "ExternalAccessToken" ALTER COLUMN "allEnvironments" SET DEFAULT true;
ALTER TABLE "ExternalAccessToken" ALTER COLUMN "environments" SET DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ExternalAccessToken" ALTER COLUMN "createdById" DROP NOT NULL;

UPDATE "ExternalAccessToken"
SET "allEnvironments" = true,
    "environments" = ARRAY[]::TEXT[];

ALTER TABLE "ExternalAccessToken"
  DROP CONSTRAINT IF EXISTS "ExternalAccessToken_createdById_fkey";
ALTER TABLE "ExternalAccessToken"
  ADD CONSTRAINT "ExternalAccessToken_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ExternalAccessToken_organizationId_fkey'
      AND conrelid = '"ExternalAccessToken"'::regclass
  ) THEN
    ALTER TABLE "ExternalAccessToken"
      ADD CONSTRAINT "ExternalAccessToken_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "ExternalAccessToken_organizationId_idx" ON "ExternalAccessToken"("organizationId");
