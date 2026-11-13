-- Append-only log of ticket status moves (ISO 27001 A.8.15 / A.8.32).
-- No foreign keys: the history must survive the deletion of a ticket, list or board.
CREATE TABLE IF NOT EXISTS "TaskStateTransition" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "boardId" TEXT NOT NULL,
  "fromListId" TEXT,
  "fromListTitle" TEXT,
  "toListId" TEXT NOT NULL,
  "toListTitle" TEXT NOT NULL,
  "movedById" TEXT,
  "assigneeIdAtMove" TEXT,
  "storyPointsAtMove" INTEGER,
  "completedAfterMove" BOOLEAN NOT NULL,
  "durationMs" BIGINT,
  "transitionedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TaskStateTransition_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TaskStateTransition_taskId_transitionedAt_idx" ON "TaskStateTransition"("taskId", "transitionedAt");
CREATE INDEX IF NOT EXISTS "TaskStateTransition_boardId_transitionedAt_idx" ON "TaskStateTransition"("boardId", "transitionedAt");

-- Reject any change to existing rows. Only INSERT is allowed.
CREATE OR REPLACE FUNCTION task_state_transition_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'TaskStateTransition is append-only (% not allowed)', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS task_state_transition_no_update_delete ON "TaskStateTransition";
CREATE TRIGGER task_state_transition_no_update_delete
  BEFORE UPDATE OR DELETE ON "TaskStateTransition"
  FOR EACH ROW EXECUTE FUNCTION task_state_transition_append_only();
