import {
  LayoutDashboard,
  Columns3,
  UserPlus,
  Sparkles,
  BarChart3,
} from "lucide-react";

/**
 * El recorrido real de alguien que empieza, en el orden en que ocurre.
 *
 * Las claves de traducción se escriben enteras y `as const` las conserva como
 * literales: así next-intl comprueba en compilación que cada una existe, en
 * vez de fallar en pantalla con una clave inventada.
 */
export const FLOW = [
  {
    key: "board",
    Icon: LayoutDashboard,
    visual: "board",
    title: "steps.board.title",
    body: "steps.board.body",
    bullets: ["steps.board.b1", "steps.board.b2", "steps.board.b3"],
  },
  {
    key: "structure",
    Icon: Columns3,
    visual: "lists",
    title: "steps.structure.title",
    body: "steps.structure.body",
    bullets: ["steps.structure.b1", "steps.structure.b2", "steps.structure.b3"],
  },
  {
    key: "team",
    Icon: UserPlus,
    visual: "team",
    title: "steps.team.title",
    body: "steps.team.body",
    bullets: ["steps.team.b1", "steps.team.b2", "steps.team.b3"],
  },
  {
    key: "ai",
    Icon: Sparkles,
    visual: "ai",
    title: "steps.ai.title",
    body: "steps.ai.body",
    bullets: ["steps.ai.b1", "steps.ai.b2", "steps.ai.b3"],
  },
  {
    key: "measure",
    Icon: BarChart3,
    visual: "metrics",
    title: "steps.measure.title",
    body: "steps.measure.body",
    bullets: ["steps.measure.b1", "steps.measure.b2", "steps.measure.b3"],
  },
] as const;

export type FlowStep = (typeof FLOW)[number];

/** Preguntas de la sección final. */
export const FAQ = ["price", "data", "team", "ai", "languages", "export"] as const;
