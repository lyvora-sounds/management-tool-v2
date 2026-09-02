-- Estado del onboarding por usuario.
--
-- Dos columnas nulables y nada más: null significa "todavía no ha pasado",
-- que es exactamente el estado que queremos para los usuarios que ya existían
-- antes de esta migración. Ninguno de los dos campos necesita backfill.
--
-- IF NOT EXISTS por la misma razón que las migraciones anteriores: esta base
-- ya ha recibido objetos por `db push` fuera de migraciones, así que damos por
-- hecho que la migración puede correr sobre una base que ya los tiene.

ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "onboardingDismissedAt" TIMESTAMP(3);
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "tourSeenAt" TIMESTAMP(3);
