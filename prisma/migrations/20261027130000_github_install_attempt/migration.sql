-- Single-use install attempts, one-time setup results, and retired installation ids.
CREATE TABLE "OrganizationGithubInstallAttempt" (
    "id" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "candidateInstallationId" TEXT,
    "codeVerifier" TEXT,
    "choices" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationGithubInstallAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrganizationGithubInstallAttempt_nonce_key" ON "OrganizationGithubInstallAttempt"("nonce");
CREATE INDEX "OrganizationGithubInstallAttempt_organizationId_status_idx" ON "OrganizationGithubInstallAttempt"("organizationId", "status");
CREATE INDEX "OrganizationGithubInstallAttempt_userId_idx" ON "OrganizationGithubInstallAttempt"("userId");

ALTER TABLE "OrganizationGithubInstallAttempt" ADD CONSTRAINT "OrganizationGithubInstallAttempt_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationGithubInstallAttempt" ADD CONSTRAINT "OrganizationGithubInstallAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "OrganizationGithubSetupResult" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "outcome" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationGithubSetupResult_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrganizationGithubSetupResult_token_key" ON "OrganizationGithubSetupResult"("token");
CREATE INDEX "OrganizationGithubSetupResult_userId_idx" ON "OrganizationGithubSetupResult"("userId");

ALTER TABLE "OrganizationGithubSetupResult" ADD CONSTRAINT "OrganizationGithubSetupResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationGithubSetupResult" ADD CONSTRAINT "OrganizationGithubSetupResult_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "RetiredGithubInstallation" (
    "installationId" TEXT NOT NULL,
    "retiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RetiredGithubInstallation_pkey" PRIMARY KEY ("installationId")
);
