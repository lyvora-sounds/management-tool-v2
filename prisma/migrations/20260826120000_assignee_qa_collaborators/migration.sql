-- Rediseño de asignaciones: assignee único + QA + colaboradores.
-- Sustituye la tabla TaskAssignee (varios asignados por tarea).
--
-- IDEMPOTENTE a propósito. Producción ya recibió estos objetos por un
-- `prisma db push` fuera de migraciones, así que esta migración tiene que
-- poder aplicarse tanto sobre una base que ya los tiene como sobre una base
-- nueva creada desde 0_init.

-- Task.assigneeId / Task.qaId
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "assigneeId" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "qaId" TEXT;

CREATE INDEX IF NOT EXISTS "Task_assigneeId_idx" ON "Task"("assigneeId");
CREATE INDEX IF NOT EXISTS "Task_qaId_idx" ON "Task"("qaId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"Task"'::regclass AND conname = 'Task_assigneeId_fkey') THEN
    ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey"
      FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"Task"'::regclass AND conname = 'Task_qaId_fkey') THEN
    ALTER TABLE "Task" ADD CONSTRAINT "Task_qaId_fkey"
      FOREIGN KEY ("qaId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- TaskCollaborator
CREATE TABLE IF NOT EXISTS "TaskCollaborator" (
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "TaskCollaborator_pkey" PRIMARY KEY ("taskId","userId")
);

CREATE INDEX IF NOT EXISTS "TaskCollaborator_taskId_idx" ON "TaskCollaborator"("taskId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"TaskCollaborator"'::regclass AND conname = 'TaskCollaborator_taskId_fkey') THEN
    ALTER TABLE "TaskCollaborator" ADD CONSTRAINT "TaskCollaborator_taskId_fkey"
      FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"TaskCollaborator"'::regclass AND conname = 'TaskCollaborator_userId_fkey') THEN
    ALTER TABLE "TaskCollaborator" ADD CONSTRAINT "TaskCollaborator_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Retirada del modelo anterior.
-- Decisión de equipo (2026-08-26): las asignaciones de TaskAssignee se
-- descartan, no se traspasan al modelo nuevo.
DROP TABLE IF EXISTS "TaskAssignee";
