-- AlterTable
ALTER TABLE "ExternalAccessToken" ADD COLUMN "fullAccess" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ExternalAccessToken" ALTER COLUMN "organizationId" DROP NOT NULL;

-- Enforce credential shapes: org/board tokens keep an organization; full-access has neither.
ALTER TABLE "ExternalAccessToken" ADD CONSTRAINT "ExternalAccessToken_fullAccess_shape" CHECK (
  ("fullAccess" = false AND "organizationId" IS NOT NULL)
  OR
  ("fullAccess" = true AND "organizationId" IS NULL AND "boardId" IS NULL)
);
