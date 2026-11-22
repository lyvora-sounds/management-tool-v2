import type { ListWithTasks, TaskWithLabels } from "@/app/(routes)/(dashboard)/board/[boardId]/components/TaskCard/TaskCard.types";
import { labelFromApi } from "./labels";
import { taskFromApi } from "./tasks";
import type { ApiBoardView, ApiBoardViewTask } from "./types";

type Customs = NonNullable<TaskWithLabels["customValues"]>;

/** A ticket of the board view, as the card and the modal take it. The share token and event id are not sent, so they are null. */
export function boardTaskFromApi(task: ApiBoardViewTask): TaskWithLabels {
  return {
    ...taskFromApi(task),
    labels: task.labels.map(({ label }) => ({ label: labelFromApi(label) })),
    assignee: task.assignee,
    qa: task.qa,
    reporter: task.reporter,
    collaborators: task.collaborators.map(({ user }) => ({ user })),
    subtasks: task.subtasks,
    epic: task.epic,
    customValues: task.customValues.map((value): Customs[number] => ({
      id: value.id,
      value: value.value,
      customField: {
        name: value.customField.name,
        enabled: value.customField.enabled,
        defaultKey: value.customField.defaultKey,
      },
    })),
    _count: task._count,
  };
}

/** The lists of a board view with their tickets, in the order the API sent them. */
export function listsFromApi(view: ApiBoardView): ListWithTasks[] {
  return view.lists.map((list) => ({
    id: list.id,
    title: list.title,
    order: list.order,
    boardId: list.boardId,
    createdAt: new Date(list.createdAt),
    updatedAt: new Date(list.updatedAt),
    tasks: list.tasks.map(boardTaskFromApi),
  }));
}
