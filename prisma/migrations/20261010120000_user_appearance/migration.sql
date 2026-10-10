-- Preferencias de apariencia por usuario (modo, acento, densidad, tarjeta).
-- Aditiva y nullable: los usuarios existentes quedan con null = tema original.
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "appearance" JSONB;
