-- Stable board keys and per-board ticket numbers for branch names.

CREATE OR REPLACE FUNCTION board_key_from_title(title text) RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  cleaned text;
  words text[];
  word text;
  initials text := '';
  compact text := '';
BEGIN
  cleaned := upper(regexp_replace(coalesce(title, ''), '[^A-Za-z]+', ' ', 'g'));
  words := regexp_split_to_array(trim(cleaned), '\s+');
  IF words IS NULL THEN
    RETURN 'BD';
  END IF;
  FOREACH word IN ARRAY words LOOP
    IF word IS NOT NULL AND word <> '' THEN
      initials := initials || substr(word, 1, 1);
      compact := compact || word;
    END IF;
  END LOOP;
  IF length(initials) >= 2 THEN
    RETURN substr(initials, 1, 2);
  ELSIF length(compact) >= 2 THEN
    RETURN substr(compact, 1, 2);
  ELSIF length(compact) = 1 THEN
    RETURN compact || 'X';
  ELSE
    RETURN 'BD';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION next_free_board_key(preferred text, organization_id text) RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  start_at integer;
  step integer;
  cursor integer;
  candidate text;
BEGIN
  IF preferred IS NULL OR preferred !~ '^[A-Z]{2}$' THEN
    preferred := 'BD';
  END IF;
  start_at := (ascii(substr(preferred, 1, 1)) - 65) * 26 + (ascii(substr(preferred, 2, 1)) - 65);
  FOR step IN 0..675 LOOP
    cursor := (start_at + step) % 676;
    candidate := chr(65 + cursor / 26) || chr(65 + (cursor % 26));
    IF NOT EXISTS (
      SELECT 1 FROM "Board"
      WHERE "organizationId" = organization_id AND key = candidate
    ) THEN
      RETURN candidate;
    END IF;
  END LOOP;
  RAISE EXCEPTION 'No board key left';
END;
$$;

ALTER TABLE "Board" ADD COLUMN "key" TEXT;
ALTER TABLE "Board" ADD COLUMN "nextTicketNumber" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Task" ADD COLUMN "number" INTEGER;

WITH ranked AS (
  SELECT t.id,
         ROW_NUMBER() OVER (
           PARTITION BY l."boardId"
           ORDER BY t."createdAt" ASC, t.id ASC
         )::int AS n
  FROM "Task" t
  JOIN "List" l ON l.id = t."listId"
)
UPDATE "Task" AS t
SET "number" = ranked.n
FROM ranked
WHERE t.id = ranked.id;

UPDATE "Board" AS b
SET "nextTicketNumber" = COALESCE(counts.max_number, 0) + 1
FROM (
  SELECT l."boardId" AS board_id, MAX(t."number") AS max_number
  FROM "List" l
  LEFT JOIN "Task" t ON t."listId" = l.id
  GROUP BY l."boardId"
) AS counts
WHERE b.id = counts.board_id;

DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT id, title, "organizationId"
    FROM "Board"
    ORDER BY "organizationId", "createdAt", id
  LOOP
    UPDATE "Board"
    SET key = next_free_board_key(board_key_from_title(rec.title), rec."organizationId")
    WHERE id = rec.id;
  END LOOP;
END $$;

ALTER TABLE "Board" ALTER COLUMN "key" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "number" SET NOT NULL;

CREATE UNIQUE INDEX "Board_organizationId_key_key" ON "Board"("organizationId", "key");

-- A writer that omits the key or the number still gets one. The app sets both itself.
CREATE OR REPLACE FUNCTION assign_board_key() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.key IS NULL OR NEW.key = '' THEN
    NEW.key := next_free_board_key(board_key_from_title(NEW.title), NEW."organizationId");
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "Board_assign_key"
BEFORE INSERT ON "Board"
FOR EACH ROW
EXECUTE FUNCTION assign_board_key();

CREATE OR REPLACE FUNCTION assign_task_number() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  board_id text;
  assigned integer;
BEGIN
  IF NEW.number IS NOT NULL THEN
    RETURN NEW;
  END IF;
  SELECT "boardId" INTO board_id FROM "List" WHERE id = NEW."listId";
  IF board_id IS NULL THEN
    RAISE EXCEPTION 'Task list is missing';
  END IF;
  UPDATE "Board"
  SET "nextTicketNumber" = "nextTicketNumber" + 1
  WHERE id = board_id
  RETURNING "nextTicketNumber" - 1 INTO assigned;
  NEW.number := assigned;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "Task_assign_number"
BEFORE INSERT ON "Task"
FOR EACH ROW
EXECUTE FUNCTION assign_task_number();
