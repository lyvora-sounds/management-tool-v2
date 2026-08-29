-- Custom fields + unique (boardId, defaultKey).
-- IDEMPOTENTE: producción pudo haber recibido estas tablas por `prisma db push`.
-- `db push` creates UNIQUE INDEXES, not table CONSTRAINTS, so we must skip
-- both pg_constraint rows and existing pg_class relations of the same name.

CREATE TABLE IF NOT EXISTS "CustomField" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "options" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "defaultKey" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomField_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CustomFieldValue" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "customFieldId" TEXT NOT NULL,
    "value" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFieldValue_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CustomField_boardId_idx" ON "CustomField"("boardId");
CREATE INDEX IF NOT EXISTS "CustomFieldValue_taskId_idx" ON "CustomFieldValue"("taskId");
CREATE INDEX IF NOT EXISTS "CustomFieldValue_customFieldId_idx" ON "CustomFieldValue"("customFieldId");

DO $$ BEGIN
  IF to_regclass('public."CustomFieldValue_taskId_customFieldId_key"') IS NULL THEN
    ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_taskId_customFieldId_key"
      UNIQUE ("taskId", "customFieldId");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = '"CustomField"'::regclass AND conname = 'CustomField_boardId_fkey'
  ) THEN
    ALTER TABLE "CustomField" ADD CONSTRAINT "CustomField_boardId_fkey"
      FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = '"CustomFieldValue"'::regclass AND conname = 'CustomFieldValue_taskId_fkey'
  ) THEN
    ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_taskId_fkey"
      FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = '"CustomFieldValue"'::regclass AND conname = 'CustomFieldValue_customFieldId_fkey'
  ) THEN
    ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_customFieldId_fkey"
      FOREIGN KEY ("customFieldId") REFERENCES "CustomField"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Deduplicar defaultKey por board, conservando la fila más antigua.
--
-- Se ordena por (createdAt, id) y no solo por createdAt: los defaults se crean
-- en una misma transacción, donde now() devuelve el mismo instante para todas
-- las filas, así que una comparación estricta por createdAt dejaba duplicados
-- vivos y hacía fallar el índice único de más abajo, abortando migrate deploy.
--
-- Los valores de los duplicados se reasignan al campo superviviente ANTES de
-- borrar nada. Si se borrase primero, la foránea con ON DELETE CASCADE se
-- llevaría por delante los valores que los usuarios ya habían rellenado.
-- Paso 1: traspasar al campo superviviente los valores de los duplicados, solo
-- cuando esa tarea no tenga ya un valor en el superviviente (la restricción
-- única (taskId, customFieldId) lo impediría).
UPDATE "CustomFieldValue" v
SET "customFieldId" = d.keep_id
FROM (
  SELECT
    "id",
    first_value("id") OVER (
      PARTITION BY "boardId", "defaultKey"
      ORDER BY "createdAt", "id"
    ) AS keep_id
  FROM "CustomField"
  WHERE "defaultKey" IS NOT NULL
) d
WHERE v."customFieldId" = d."id"
  AND d."id" <> d.keep_id
  AND NOT EXISTS (
    SELECT 1 FROM "CustomFieldValue" existing
    WHERE existing."taskId" = v."taskId"
      AND existing."customFieldId" = d.keep_id
  );

-- Paso 2: ya sin valores que perder, borrar los duplicados.
DELETE FROM "CustomField" cf
USING (
  SELECT
    "id",
    first_value("id") OVER (
      PARTITION BY "boardId", "defaultKey"
      ORDER BY "createdAt", "id"
    ) AS keep_id
  FROM "CustomField"
  WHERE "defaultKey" IS NOT NULL
) d
WHERE cf."id" = d."id" AND d."id" <> d.keep_id;

CREATE UNIQUE INDEX IF NOT EXISTS "CustomField_boardId_defaultKey_key"
  ON "CustomField"("boardId", "defaultKey");
