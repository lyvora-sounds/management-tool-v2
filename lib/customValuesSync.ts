import db from "@/lib/db";
import { parseListValue, stringifyListValue } from "./customValueUtils";

export { parseListValue, stringifyListValue };

/**
 * Bi-directionally sync parent and child custom field values across tasks in a board.
 */
export async function syncParentChildRelationships({
  boardId,
  currentTaskId,
  customField,
  oldValue,
  newValue,
}: {
  boardId: string;
  currentTaskId: string;
  customField: { defaultKey: string | null; name: string };
  oldValue: string | null;
  newValue: string | null;
}) {
  const isParentField =
    customField.defaultKey === "parent" || /parent|padre/i.test(customField.name);
  const isChildField =
    customField.defaultKey === "child" || /child|hijo/i.test(customField.name);

  if (!isParentField && !isChildField) return;

  const currentTask = await db.task.findUnique({
    where: { id: currentTaskId },
    select: { id: true, title: true },
  });

  if (!currentTask) return;

  // Find parent and child custom fields for this board
  const parentField = await db.customField.findFirst({
    where: {
      boardId,
      OR: [{ defaultKey: "parent" }, { name: { contains: "parent", mode: "insensitive" } }],
    },
  });

  const childField = await db.customField.findFirst({
    where: {
      boardId,
      OR: [{ defaultKey: "child" }, { name: { contains: "child", mode: "insensitive" } }],
    },
  });

  if (isParentField) {
    const oldParentTitle = oldValue && !oldValue.startsWith("[EPIC]") ? oldValue.trim() : null;
    const newParentTitle = newValue && !newValue.startsWith("[EPIC]") ? newValue.trim() : null;

    // If old parent changed, remove currentTask from old parent's child list
    if (oldParentTitle && oldParentTitle !== newParentTitle && childField) {
      const oldParentTask = await db.task.findFirst({
        where: { title: oldParentTitle, list: { boardId } },
        select: { id: true },
      });

      if (oldParentTask) {
        const oldParentChildValRecord = await db.customFieldValue.findUnique({
          where: {
            taskId_customFieldId: {
              taskId: oldParentTask.id,
              customFieldId: childField.id,
            },
          },
        });

        const currentChildren = parseListValue(oldParentChildValRecord?.value);
        const updatedChildren = currentChildren.filter((t) => t !== currentTask.title);

        await db.customFieldValue.upsert({
          where: {
            taskId_customFieldId: {
              taskId: oldParentTask.id,
              customFieldId: childField.id,
            },
          },
          update: { value: stringifyListValue(updatedChildren) },
          create: {
            taskId: oldParentTask.id,
            customFieldId: childField.id,
            value: stringifyListValue(updatedChildren),
          },
        });
      }
    }

    // If new parent set, add currentTask to new parent's child list
    if (newParentTitle && childField) {
      const newParentTask = await db.task.findFirst({
        where: { title: newParentTitle, list: { boardId } },
        select: { id: true },
      });

      if (newParentTask) {
        const newParentChildValRecord = await db.customFieldValue.findUnique({
          where: {
            taskId_customFieldId: {
              taskId: newParentTask.id,
              customFieldId: childField.id,
            },
          },
        });

        const currentChildren = parseListValue(newParentChildValRecord?.value);
        if (!currentChildren.includes(currentTask.title)) {
          const updatedChildren = [...currentChildren, currentTask.title];

          await db.customFieldValue.upsert({
            where: {
              taskId_customFieldId: {
                taskId: newParentTask.id,
                customFieldId: childField.id,
              },
            },
            update: { value: stringifyListValue(updatedChildren) },
            create: {
              taskId: newParentTask.id,
              customFieldId: childField.id,
              value: stringifyListValue(updatedChildren),
            },
          });
        }
      }
    }
  } else if (isChildField) {
    const oldChildren = parseListValue(oldValue);
    const newChildren = parseListValue(newValue);

    const removedChildren = oldChildren.filter((c) => !newChildren.includes(c));
    const addedChildren = newChildren.filter((c) => !oldChildren.includes(c));

    // For removed children, clear their parent field if it pointed to currentTask.title
    if (parentField && removedChildren.length > 0) {
      for (const childTitle of removedChildren) {
        const childTask = await db.task.findFirst({
          where: { title: childTitle, list: { boardId } },
          select: { id: true },
        });

        if (childTask) {
          const parentValRecord = await db.customFieldValue.findUnique({
            where: {
              taskId_customFieldId: {
                taskId: childTask.id,
                customFieldId: parentField.id,
              },
            },
          });

          if (parentValRecord?.value === currentTask.title) {
            await db.customFieldValue.update({
              where: { id: parentValRecord.id },
              data: { value: null },
            });
          }
        }
      }
    }

    // For added children, set their parent field to currentTask.title
    if (parentField && addedChildren.length > 0) {
      for (const childTitle of addedChildren) {
        const childTask = await db.task.findFirst({
          where: { title: childTitle, list: { boardId } },
          select: { id: true },
        });

        if (childTask) {
          await db.customFieldValue.upsert({
            where: {
              taskId_customFieldId: {
                taskId: childTask.id,
                customFieldId: parentField.id,
              },
            },
            update: { value: currentTask.title },
            create: {
              taskId: childTask.id,
              customFieldId: parentField.id,
              value: currentTask.title,
            },
          });
        }
      }
    }
  }
}
