import { describe, it, expect, beforeEach } from "vitest";
import { useBoardStore } from "@/app/(routes)/(dashboard)/board/[boardId]/store/useBoardStore";

// Sólo interesan id y tasks; el resto del modelo no participa en moveTask.
const task = (id: string) => ({ id }) as never;
const seed = () =>
  [
    { id: "L1", title: "To Do", tasks: [task("T1"), task("T2"), task("T3")] },
    { id: "L2", title: "Doing", tasks: [task("T4")] },
    { id: "L3", title: "Done", tasks: [] },
  ] as never;

const snapshot = () =>
  Object.fromEntries(
    useBoardStore.getState().lists.map((l) => [l.id, l.tasks.map((t) => t.id)]),
  );

beforeEach(() => {
  useBoardStore.getState().setLists(seed());
});

describe("moveTask entre listas", () => {
  it("mueve la tarea a la posición indicada de la lista destino", () => {
    useBoardStore.getState().moveTask("T1", "L1", "L2", 0);
    expect(snapshot()).toEqual({ L1: ["T2", "T3"], L2: ["T1", "T4"], L3: [] });
  });

  it("añade al final cuando el índice es la longitud de la lista destino", () => {
    // Es lo que hace "Mover a lista": toIndex = tasks.length del destino.
    useBoardStore.getState().moveTask("T1", "L1", "L2", 1);
    expect(snapshot()).toEqual({ L1: ["T2", "T3"], L2: ["T4", "T1"], L3: [] });
  });

  it("mueve a una lista vacía", () => {
    useBoardStore.getState().moveTask("T2", "L1", "L3", 0);
    expect(snapshot()).toEqual({ L1: ["T1", "T3"], L2: ["T4"], L3: ["T2"] });
  });

  it("actualiza el listId de la tarea movida", () => {
    useBoardStore.getState().moveTask("T1", "L1", "L2", 0);
    const moved = useBoardStore
      .getState()
      .lists.find((l) => l.id === "L2")!
      .tasks.find((t) => t.id === "T1")!;
    expect((moved as { listId?: string }).listId).toBe("L2");
  });

  it("deshacer el movimiento devuelve la tarea a su posición original", () => {
    // Es el camino de reversión cuando falla la petición de guardado.
    const antes = snapshot();
    useBoardStore.getState().moveTask("T2", "L1", "L2", 0);
    useBoardStore.getState().moveTask("T2", "L2", "L1", 1);
    expect(snapshot()).toEqual(antes);
  });
});

describe("moveTask dentro de la misma lista", () => {
  it("reordena sin cambiar de lista", () => {
    useBoardStore.getState().moveTask("T1", "L1", "L1", 2);
    expect(snapshot()).toEqual({ L1: ["T2", "T3", "T1"], L2: ["T4"], L3: [] });
  });
});

describe("moveTask con argumentos inválidos", () => {
  it("no altera el estado si la lista destino no existe", () => {
    // Este es el fallo que rompió el arrastre: pasar un id de tarea donde
    // se esperaba un id de lista dejaba el estado intacto y en silencio.
    const antes = snapshot();
    useBoardStore.getState().moveTask("T1", "L1", "T3", 0);
    expect(snapshot()).toEqual(antes);
  });

  it("no altera el estado si la tarea no está en la lista de origen", () => {
    const antes = snapshot();
    useBoardStore.getState().moveTask("T4", "L1", "L2", 0);
    expect(snapshot()).toEqual(antes);
  });
});
