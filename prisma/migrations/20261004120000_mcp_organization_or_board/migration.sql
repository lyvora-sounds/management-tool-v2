-- An MCP credential always belongs to one organization.
-- boardId stays set for a single-board credential and becomes null for an
-- organization credential. Existing rows copy the board's organization.

ALTER TABLE "ExternalAccessToken" ADD COLUMN "organizationId" TEXT;

UPDATE "ExternalAccessToken" AS token
SET "organizationId" = board."organizationId"
FROM "Board" AS board
WHERE token."boardId" = board."id";

DELETE FROM "ExternalAccessToken" WHERE "organizationId" IS NULL;

ALTER TABLE "ExternalAccessToken" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "ExternalAccessToken" ALTER COLUMN "boardId" DROP NOT NULL;
ALTER TABLE "ExternalAccessToken" ALTER COLUMN "allEnvironments" SET DEFAULT true;

UPDATE "ExternalAccessToken"
SET "allEnvironments" = true,
    "environments" = ARRAY[]::TEXT[];

ALTER TABLE "ExternalAccessToken"
  ADD CONSTRAINT "ExternalAccessToken_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "ExternalAccessToken_organizationId_idx" ON "ExternalAccessToken"("organizationId");
