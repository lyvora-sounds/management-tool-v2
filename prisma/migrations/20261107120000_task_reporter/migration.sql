-- Optional reporter on a ticket (who reported the issue).
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "reporterId" TEXT;

CREATE INDEX IF NOT EXISTS "Task_reporterId_idx" ON "Task"("reporterId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"Task"'::regclass AND conname = 'Task_reporterId_fkey') THEN
    ALTER TABLE "Task" ADD CONSTRAINT "Task_reporterId_fkey"
      FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
