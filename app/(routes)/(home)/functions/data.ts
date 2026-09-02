import {
  LayoutDashboard,
  Users,
  Sparkles,
  SlidersHorizontal,
  Layers,
  Tags,
  ListChecks,
  CalendarIcon,
  MessageSquare,
  Bell,
  BarChart2,
  Plug,
  Paperclip,
  Share2,
} from "lucide-react";

/**
 * Catálogo de capacidades. El orden va de lo que usa todo el mundo a diario a
 * lo que se configura una vez, no por orden de aparición en el código.
 *
 * Sin anotación de tipo a propósito: `as const` conserva las claves como tipos
 * literales, que es lo que next-intl necesita para comprobar que existen.
 */
export const details = [
  {
    Icon: LayoutDashboard,
    title: "kanbanTitle",
    description: "kanbanDesc",
    points: ["kanbanP1", "kanbanP2", "kanbanP3", "kanbanP4"],
  },
  {
    Icon: Users,
    title: "collabTitle",
    description: "collabDesc",
    points: ["collabP1", "collabP2", "collabP3", "collabP4"],
  },
  {
    Icon: Sparkles,
    title: "aiTitle",
    description: "aiDesc",
    points: ["aiP1", "aiP2", "aiP3", "aiP4"],
  },
  {
    Icon: SlidersHorizontal,
    title: "fieldsTitle",
    description: "fieldsDesc",
    points: ["fieldsP1", "fieldsP2", "fieldsP3", "fieldsP4"],
  },
  {
    Icon: Layers,
    title: "epicsTitle",
    description: "epicsDesc",
    points: ["epicsP1", "epicsP2", "epicsP3", "epicsP4"],
  },
  {
    Icon: Tags,
    title: "labelsTitle",
    description: "labelsDesc",
    points: ["labelsP1", "labelsP2", "labelsP3", "labelsP4"],
  },
  {
    Icon: ListChecks,
    title: "subtasksTitle",
    description: "subtasksDesc",
    points: ["subtasksP1", "subtasksP2", "subtasksP3", "subtasksP4"],
  },
  {
    Icon: CalendarIcon,
    title: "calendarTitle",
    description: "calendarDesc",
    points: ["calendarP1", "calendarP2", "calendarP3", "calendarP4"],
  },
  {
    Icon: MessageSquare,
    title: "commentsTitle",
    description: "commentsDesc",
    points: ["commentsP1", "commentsP2", "commentsP3", "commentsP4"],
  },
  {
    Icon: Bell,
    title: "notifTitle",
    description: "notifDesc",
    points: ["notifP1", "notifP2", "notifP3", "notifP4"],
  },
  {
    Icon: BarChart2,
    title: "metricsTitle",
    description: "metricsDesc",
    points: ["metricsP1", "metricsP2", "metricsP3", "metricsP4"],
  },
  {
    Icon: Plug,
    title: "integrationsTitle",
    description: "integrationsDesc",
    points: ["integrationsP1", "integrationsP2", "integrationsP3", "integrationsP4"],
  },
  {
    Icon: Paperclip,
    title: "attachmentsTitle",
    description: "attachmentsDesc",
    points: ["attachmentsP1", "attachmentsP2", "attachmentsP3", "attachmentsP4"],
  },
  {
    Icon: Share2,
    title: "shareTitle",
    description: "shareDesc",
    points: ["shareP1", "shareP2", "shareP3", "shareP4"],
  },
] as const;
