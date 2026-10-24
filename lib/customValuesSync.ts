import db from "@/lib/db";
import { isChildFieldKey, isParentFieldKey } from "@/lib/customFieldsDefaults";
import { parseListValue, stringifyListValue } from "@/lib/customValueUtils";

type DbClient = Pick<typeof db, "task" | "customField" | "customFieldValue">;

async function taskOnBoard(
  tx: DbClient,
  taskId: string,
  boardId: string,
): Promise<boolean> {
  const task = await tx.task.findFirst({
    where: { id: taskId, list: { boardId } },
    select: { id: true },
  });
  return Boolean(task);
}

async function patchChildList(
  tx: DbClient,
  parentTaskId: string,
  childFieldId: string,
  mutate: (ids: string[]) => string[],
) {
  const record = await tx.customFieldValue.findUnique({
    where: {
      taskId_customFieldId: {
        taskId: parentTaskId,
        customFieldId: childFieldId,
      },
    },
  });
  const next = mutate(parseListValue(record?.value));
  await tx.customFieldValue.upsert({
    where: {
      taskId_customFieldId: {
        taskId: parentTaskId,
        customFieldId: childFieldId,
      },
    },
    update: { value: stringifyListValue(next) },
    create: {
      taskId: parentTaskId,
      customFieldId: childFieldId,
      value: stringifyListValue(next),
    },
  });
}

/**
 * Keep parent/child custom values consistent across tasks.
 * Values are task IDs (single ID for parent, JSON array of IDs for child).
 * Does not rewrite the field that was just saved.
 *
 * Recibe el cliente de transacción del llamante en lugar de abrir la suya:
 * guardar el valor y propagar la relación tienen que ser atómicos, o un fallo
 * a mitad deja padre e hijo apuntándose de forma inconsistente.
 */
export async function syncParentChildRelationships(
  tx: DbClient,
  {
    boardId,
    currentTaskId,
    customField,
    oldValue,
    newValue,
  }: {
    boardId: string;
    currentTaskId: string;
    customField: { defaultKey: string | null };
    oldValue: string | null;
    newValue: string | null;
  },
) {
  if (!isParentFieldKey(customField.defaultKey) && !isChildFieldKey(customField.defaultKey)) {
    return;
  }

  {
    const [parentField, childField] = await Promise.all([
      tx.customField.findFirst({
        where: { boardId, defaultKey: "parent" },
        select: { id: true },
      }),
      tx.customField.findFirst({
        where: { boardId, defaultKey: "child" },
        select: { id: true },
      }),
    ]);

    if (!parentField || !childField) return;

    const oldIds = parseListValue(oldValue);
    const newIds = parseListValue(newValue);
    const removed = oldIds.filter((id) => !newIds.includes(id));
    const added = newIds.filter((id) => !oldIds.includes(id));
    const targetFieldId = isParentFieldKey(customField.defaultKey)
      ? childField.id
      : parentField.id;

    for (const relatedId of removed) {
      if (!(await taskOnBoard(tx, relatedId, boardId))) continue;
      await patchChildList(tx, relatedId, targetFieldId, (ids) =>
        ids.filter((id) => id !== currentTaskId),
      );
    }

    for (const relatedId of added) {
      if (relatedId === currentTaskId) continue;
      if (!(await taskOnBoard(tx, relatedId, boardId))) continue;
      await patchChildList(tx, relatedId, targetFieldId, (ids) =>
        ids.includes(currentTaskId) ? ids : [...ids, currentTaskId],
      );
    }
  }
}
