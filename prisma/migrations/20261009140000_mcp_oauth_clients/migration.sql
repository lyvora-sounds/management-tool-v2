CREATE TABLE "McpOAuthClient" (
  "id" TEXT NOT NULL,
  "secretHash" TEXT NOT NULL,
  "allowWrite" BOOLEAN NOT NULL DEFAULT false,
  "redirectUris" TEXT[],
  "createdById" TEXT NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "McpOAuthClient_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "McpOAuthClient_createdById_idx" ON "McpOAuthClient"("createdById");
ALTER TABLE "McpOAuthClient" ADD CONSTRAINT "McpOAuthClient_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
