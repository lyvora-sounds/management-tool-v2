CREATE TABLE "McpOAuthGrant" (
  "id" TEXT NOT NULL,
  "externalAccessTokenId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "redirectUri" TEXT NOT NULL,
  "resource" TEXT NOT NULL,
  "codeHash" TEXT,
  "codeChallenge" TEXT NOT NULL,
  "codeExpiresAt" TIMESTAMP(3) NOT NULL,
  "accessTokenHash" TEXT,
  "accessExpiresAt" TIMESTAMP(3),
  "refreshTokenHash" TEXT,
  "refreshExpiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "McpOAuthGrant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "McpOAuthGrant_externalAccessTokenId_key" ON "McpOAuthGrant"("externalAccessTokenId");
CREATE UNIQUE INDEX "McpOAuthGrant_codeHash_key" ON "McpOAuthGrant"("codeHash");
CREATE UNIQUE INDEX "McpOAuthGrant_accessTokenHash_key" ON "McpOAuthGrant"("accessTokenHash");
CREATE UNIQUE INDEX "McpOAuthGrant_refreshTokenHash_key" ON "McpOAuthGrant"("refreshTokenHash");
ALTER TABLE "McpOAuthGrant" ADD CONSTRAINT "McpOAuthGrant_externalAccessTokenId_fkey" FOREIGN KEY ("externalAccessTokenId") REFERENCES "ExternalAccessToken"("id") ON DELETE CASCADE ON UPDATE CASCADE;
