CREATE TABLE "McpChange" (
 "id" TEXT NOT NULL,
 "organizationId" TEXT NOT NULL,
 "boardId" TEXT NOT NULL,
 "tokenId" TEXT,
 "actorId" TEXT NOT NULL,
 "kind" TEXT NOT NULL,
 "summary" TEXT NOT NULL,
 "before" JSONB NOT NULL,
 "after" JSONB NOT NULL,
 "revertsChangeId" TEXT,
 "revertedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "McpChange_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "McpChange_revertsChangeId_key" ON "McpChange"("revertsChangeId");
CREATE INDEX "McpChange_organizationId_createdAt_idx" ON "McpChange"("organizationId", "createdAt");
CREATE INDEX "McpChange_boardId_createdAt_idx" ON "McpChange"("boardId", "createdAt");
ALTER TABLE "McpChange" ADD CONSTRAINT "McpChange_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "McpChange" ADD CONSTRAINT "McpChange_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
