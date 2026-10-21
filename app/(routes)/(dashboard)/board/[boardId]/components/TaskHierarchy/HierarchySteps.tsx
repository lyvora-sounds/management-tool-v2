"use client";

import { createContext, useContext, useMemo } from "react";
import { hierarchySteps, type HierarchyStep } from "@/lib/hierarchyDiagram";
import { hierarchyNodesFromLists } from "./hierarchyNodes";

type Lists = Parameters<typeof hierarchyNodesFromLists>[0];

const EMPTY = new Map<string, HierarchyStep>();
const HierarchyStepsContext = createContext<Map<string, HierarchyStep>>(EMPTY);

/** Calcula una sola vez el paso de cada ticket del tablero, para que las tarjetas no lo recalculen cada una. */
export function HierarchyStepsProvider({ lists, children }: { lists: Lists; children: React.ReactNode }) {
  const steps = useMemo(() => hierarchySteps(hierarchyNodesFromLists(lists)), [lists]);
  return <HierarchyStepsContext.Provider value={steps}>{children}</HierarchyStepsContext.Provider>;
}

/** Paso de un ticket dentro de su recorrido (1, 2, 3…), o undefined si no forma parte de ninguno. */
export function useHierarchyStep(taskId: string): HierarchyStep | undefined {
  return useContext(HierarchyStepsContext).get(taskId);
}
