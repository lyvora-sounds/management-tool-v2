-- One GitHub App installation per Kikiboard organization.
CREATE TABLE "OrganizationGithubConnection" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "installationId" TEXT NOT NULL,
    "accountLogin" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "repositoryId" TEXT,
    "repositoryName" TEXT,
    "branch" TEXT,
    "connectedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationGithubConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrganizationGithubConnection_organizationId_key" ON "OrganizationGithubConnection"("organizationId");
CREATE UNIQUE INDEX "OrganizationGithubConnection_installationId_key" ON "OrganizationGithubConnection"("installationId");
CREATE INDEX "OrganizationGithubConnection_connectedById_idx" ON "OrganizationGithubConnection"("connectedById");

ALTER TABLE "OrganizationGithubConnection" ADD CONSTRAINT "OrganizationGithubConnection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationGithubConnection" ADD CONSTRAINT "OrganizationGithubConnection_connectedById_fkey" FOREIGN KEY ("connectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
