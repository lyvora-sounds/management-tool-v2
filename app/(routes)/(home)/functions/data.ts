import {
  LayoutDashboard,
  Users,
  Bell,
  BarChart2,
  Tags,
  ListChecks,
  CalendarIcon,
  Link2,
  Paperclip,
  MessageSquare,
} from "lucide-react";

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
    Icon: Link2,
    title: "linksTitle",
    description: "linksDesc",
    points: ["linksP1", "linksP2", "linksP3", "linksP4"],
  },
  {
    Icon: Paperclip,
    title: "attachmentsTitle",
    description: "attachmentsDesc",
    points: ["attachmentsP1", "attachmentsP2", "attachmentsP3", "attachmentsP4"],
  },
] as const;
