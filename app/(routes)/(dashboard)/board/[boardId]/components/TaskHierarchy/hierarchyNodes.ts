import { parseListValue } from "@/lib/customValueUtils";
import type { HierarchyNode } from "@/lib/hierarchyDiagram";

type TaskLike = {
  id: string;
  title: string;
  archived?: boolean | null;
  completed?: boolean | null;
  customValues?: { value: string | null; customField?: { defaultKey?: string | null } | null }[];
};
type ListLike = { title: string; tasks: TaskLike[] };

/** Convierte las listas del tablero en nodos del recorrido, leyendo los campos «Parent ticket» y «Child ticket». */
export function hierarchyNodesFromLists(lists: ListLike[]): HierarchyNode[] {
  return lists.flatMap((list) =>
    list.tasks.map((task) => {
      const value = (key: string) => task.customValues?.find((cv) => cv.customField?.defaultKey === key)?.value ?? null;
      const parentIds = parseListValue(value("parent"));
      return {
        id: task.id,
        title: task.title,
        parentId: parentIds[0] ?? null,
        parentIds,
        childIds: parseListValue(value("child")),
        archived: Boolean(task.archived),
        completed: Boolean(task.completed),
        listTitle: list.title,
      };
    }),
  );
}
