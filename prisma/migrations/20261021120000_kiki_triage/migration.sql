-- Triage automático de Kiki. Aditiva: apagado por defecto y sin tocar datos.
ALTER TABLE "Board" ADD COLUMN IF NOT EXISTS "kikiTriage" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "agentSuggestion" JSONB;
