-- Each existing board gets its own organization, populated with that board's
-- owner and current members. accessMode stays "organization": people in the
-- organization can open the board. Restricting a board, or granting a team,
-- is a later explicit change. Boards are not merged into one organization.

CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrganizationMember" (
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("organizationId", "userId")
);

CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TeamMember" (
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("teamId", "userId")
);

CREATE TABLE "BoardTeamAccess" (
    "boardId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BoardTeamAccess_pkey" PRIMARY KEY ("boardId", "teamId")
);

ALTER TABLE "Board"
  ADD COLUMN "organizationId" TEXT,
  ADD COLUMN "accessMode" TEXT NOT NULL DEFAULT 'organization',
  ADD COLUMN "defaultRole" TEXT NOT NULL DEFAULT 'member';

INSERT INTO "Organization" ("id", "name", "createdById", "createdAt", "updatedAt")
SELECT
  'org_' || substr(md5(b."id"), 1, 24),
  b."title" || ' Organization',
  b."userId",
  b."createdAt",
  CURRENT_TIMESTAMP
FROM "Board" b;

UPDATE "Board" b
SET "organizationId" = 'org_' || substr(md5(b."id"), 1, 24);

INSERT INTO "OrganizationMember" ("organizationId", "userId", "role", "createdAt")
SELECT b."organizationId", b."userId", 'owner', b."createdAt"
FROM "Board" b
ON CONFLICT ("organizationId", "userId") DO NOTHING;

INSERT INTO "OrganizationMember" ("organizationId", "userId", "role", "createdAt")
SELECT b."organizationId", bm."userId", 'member', bm."createdAt"
FROM "BoardMember" bm
JOIN "Board" b ON b."id" = bm."boardId"
ON CONFLICT ("organizationId", "userId") DO NOTHING;

ALTER TABLE "Board" ALTER COLUMN "organizationId" SET NOT NULL;

CREATE INDEX "Organization_createdById_idx" ON "Organization"("createdById");
CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");
CREATE UNIQUE INDEX "Team_organizationId_name_key" ON "Team"("organizationId", "name");
CREATE INDEX "Team_organizationId_idx" ON "Team"("organizationId");
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");
CREATE INDEX "BoardTeamAccess_teamId_idx" ON "BoardTeamAccess"("teamId");
CREATE INDEX "Board_organizationId_idx" ON "Board"("organizationId");

ALTER TABLE "Organization" ADD CONSTRAINT "Organization_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Team" ADD CONSTRAINT "Team_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BoardTeamAccess" ADD CONSTRAINT "BoardTeamAccess_boardId_fkey"
  FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BoardTeamAccess" ADD CONSTRAINT "BoardTeamAccess_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Board" ADD CONSTRAINT "Board_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_role_check"
  CHECK ("role" IN ('owner', 'admin', 'member'));
ALTER TABLE "BoardTeamAccess" ADD CONSTRAINT "BoardTeamAccess_role_check"
  CHECK ("role" IN ('viewer', 'member', 'admin'));
ALTER TABLE "Board" ADD CONSTRAINT "Board_accessMode_check"
  CHECK ("accessMode" IN ('organization', 'restricted'));
ALTER TABLE "Board" ADD CONSTRAINT "Board_defaultRole_check"
  CHECK ("defaultRole" IN ('viewer', 'member'));
