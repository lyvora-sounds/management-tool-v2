CREATE TABLE "ExternalAccessToken" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "tokenPrefix" TEXT NOT NULL,
    "scopes" TEXT[] NOT NULL DEFAULT ARRAY['tickets:read']::TEXT[],
    "environments" TEXT[] NOT NULL DEFAULT ARRAY['*']::TEXT[],
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "boardId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalAccessToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExternalAccessToken_tokenHash_key" ON "ExternalAccessToken"("tokenHash");
CREATE INDEX "ExternalAccessToken_boardId_idx" ON "ExternalAccessToken"("boardId");
CREATE INDEX "ExternalAccessToken_createdById_idx" ON "ExternalAccessToken"("createdById");

ALTER TABLE "ExternalAccessToken" ADD CONSTRAINT "ExternalAccessToken_boardId_fkey"
  FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExternalAccessToken" ADD CONSTRAINT "ExternalAccessToken_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
