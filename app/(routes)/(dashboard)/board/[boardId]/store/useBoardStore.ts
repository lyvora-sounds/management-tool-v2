import { create } from "zustand";
import { arrayMove } from "@dnd-kit/sortable";
import type { TaskWithLabels, ListWithTasks } from "../components/TaskCard/TaskCard.types";

interface BoardState {
  lists: ListWithTasks[];

  // Inicializar con datos del servidor
  setLists: (lists: ListWithTasks[]) => void;

  // Crear
  addList: (list: ListWithTasks) => void;
  addTask: (listId: string, task: TaskWithLabels) => void;
  addSubtask: (listId: string, taskId: string, subtask: { completed: boolean }) => void;

  // Editar
  renameList: (listId: string, title: string) => void;
  updateTask: (listId: string, taskId: string, data: Partial<TaskWithLabels>) => void;

  // Eliminar
  removeList: (listId: string) => void;
  removeTask: (listId: string, taskId: string) => void;

  // Reordenar (DND)
  reorderLists: (oldIndex: number, newIndex: number) => void;
  moveTask: (
    activeId: string,
    activeListId: string,
    overListId: string,
    overIndex: number
  ) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  lists: [],

  setLists: (lists) => set({ lists }),

  addList: (list) =>
    set((state) => ({ lists: [...state.lists, list] })),

  addTask: (listId, task) =>
    set((state) => ({
      lists: state.lists.map((list) =>
        list.id === listId
          ? { ...list, tasks: [...list.tasks, task] }
          : list
      ),
    })),

  addSubtask: (listId, taskId, subtask) =>
    set((state) => ({
      lists: state.lists.map((list) =>
        list.id === listId
          ? {
              ...list,
              tasks: list.tasks.map((t) =>
                t.id === taskId
                  ? { ...t, subtasks: [...(t.subtasks ?? []), subtask] }
                  : t
              ),
            }
          : list
      ),
    })),

  renameList: (listId, title) =>
    set((state) => ({
      lists: state.lists.map((l) => (l.id === listId ? { ...l, title } : l)),
    })),

  updateTask: (listId, taskId, data) =>
    set((state) => ({
      lists: state.lists.map((l) =>
        l.id === listId
          ? { ...l, tasks: l.tasks.map((t) => (t.id === taskId ? { ...t, ...data } : t)) }
          : l
      ),
    })),

  removeList: (listId) =>
    set((state) => ({
      lists: state.lists.filter((l) => l.id !== listId),
    })),

  removeTask: (listId, taskId) =>
    set((state) => ({
      lists: state.lists.map((l) =>
        l.id === listId
          ? { ...l, tasks: l.tasks.filter((t) => t.id !== taskId) }
          : l
      ),
    })),

  reorderLists: (oldIndex, newIndex) =>
    set((state) => ({
      lists: arrayMove(state.lists, oldIndex, newIndex),
    })),

  moveTask: (activeId, activeListId, overListId, overIndex) =>
    set((state) => {
      const next = state.lists.map((l) => ({ ...l, tasks: [...l.tasks] }));
      const sourceList = next.find((l) => l.id === activeListId);
      const targetList = next.find((l) => l.id === overListId);

      if (!sourceList || !targetList) return state;

      const activeIdx = sourceList.tasks.findIndex((t) => t.id === activeId);
      if (activeIdx === -1) return state;

      if (activeListId === overListId) {
        sourceList.tasks = arrayMove(sourceList.tasks, activeIdx, overIndex);
      } else {
        const [moved] = sourceList.tasks.splice(activeIdx, 1);
        targetList.tasks.splice(overIndex, 0, { ...moved, listId: overListId });
      }

      return { lists: next };
    }),
}));
