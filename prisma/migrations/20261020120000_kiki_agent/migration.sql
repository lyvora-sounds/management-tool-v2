-- Kiki, el agente de IA del tablero. Aditiva: los datos existentes no cambian.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isAgent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Board" ADD COLUMN IF NOT EXISTS "kikiMode" TEXT NOT NULL DEFAULT 'owner';
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "agentChangeId" TEXT;
