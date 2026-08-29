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

    if (isParentFieldKey(customField.defaultKey)) {
      const oldParentId = oldValue || null;
      const newParentId = newValue || null;
      if (oldParentId === newParentId) return;

      if (oldParentId && (await taskOnBoard(tx, oldParentId, boardId))) {
        await patchChildList(tx, oldParentId, childField.id, (ids) =>
          ids.filter((id) => id !== currentTaskId),
        );
      }

      if (
        newParentId &&
        newParentId !== currentTaskId &&
        (await taskOnBoard(tx, newParentId, boardId))
      ) {
        await patchChildList(tx, newParentId, childField.id, (ids) =>
          ids.includes(currentTaskId) ? ids : [...ids, currentTaskId],
        );
      }
      return;
    }

    const oldChildren = parseListValue(oldValue);
    const newChildren = parseListValue(newValue);
    const removed = oldChildren.filter((id) => !newChildren.includes(id));
    const added = newChildren.filter((id) => !oldChildren.includes(id));

    for (const childId of removed) {
      if (!(await taskOnBoard(tx, childId, boardId))) continue;
      const parentVal = await tx.customFieldValue.findUnique({
        where: {
          taskId_customFieldId: {
            taskId: childId,
            customFieldId: parentField.id,
          },
        },
      });
      if (parentVal?.value === currentTaskId) {
        await tx.customFieldValue.update({
          where: { id: parentVal.id },
          data: { value: null },
        });
      }
    }

    for (const childId of added) {
      if (childId === currentTaskId) continue;
      if (!(await taskOnBoard(tx, childId, boardId))) continue;

      const parentVal = await tx.customFieldValue.findUnique({
        where: {
          taskId_customFieldId: {
            taskId: childId,
            customFieldId: parentField.id,
          },
        },
      });
      const previousParentId = parentVal?.value ?? null;

      await tx.customFieldValue.upsert({
        where: {
          taskId_customFieldId: {
            taskId: childId,
            customFieldId: parentField.id,
          },
        },
        update: { value: currentTaskId },
        create: {
          taskId: childId,
          customFieldId: parentField.id,
          value: currentTaskId,
        },
      });

      if (
        previousParentId &&
        previousParentId !== currentTaskId &&
        (await taskOnBoard(tx, previousParentId, boardId))
      ) {
        await patchChildList(tx, previousParentId, childField.id, (ids) =>
          ids.filter((id) => id !== childId),
        );
      }
    }
  }
}
