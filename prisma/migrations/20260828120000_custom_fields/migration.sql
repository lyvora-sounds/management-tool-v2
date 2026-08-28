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

-- Keep the oldest row when a board already has duplicate default keys.
DELETE FROM "CustomField" a
USING "CustomField" b
WHERE a."id" <> b."id"
  AND a."boardId" = b."boardId"
  AND a."defaultKey" IS NOT NULL
  AND a."defaultKey" = b."defaultKey"
  AND a."createdAt" > b."createdAt";

CREATE UNIQUE INDEX IF NOT EXISTS "CustomField_boardId_defaultKey_key"
  ON "CustomField"("boardId", "defaultKey");
