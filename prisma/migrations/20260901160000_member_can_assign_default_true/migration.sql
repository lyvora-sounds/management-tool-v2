-- Asignar deja de ser un privilegio y pasa a ser lo normal: memberCanAssign
-- por defecto en true.
--
-- El UPDATE no es opcional. Cambiar el DEFAULT solo afecta a los tableros
-- nuevos, y los que ya existen se quedarían en false, que es justo el estado
-- que estamos declarando incorrecto. Ese false viene del valor por defecto
-- anterior, no de una decisión: el interruptor solo lo veía el propietario y
-- estaba escondido en un menú. Quien lo quiera apagado vuelve a apagarlo desde
-- Permisos del tablero, que es un clic.

ALTER TABLE "Board" ALTER COLUMN "memberCanAssign" SET DEFAULT true;

UPDATE "Board" SET "memberCanAssign" = true WHERE "memberCanAssign" = false;
