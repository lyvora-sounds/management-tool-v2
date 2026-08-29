import {
  CheckCircle2,
  Users,
  LayoutDashboard,
  Bell,
  Tags,
  Paperclip,
  Calendar,
  BarChart2,
  ListTodo,
  Zap,
} from "lucide-react";

export const features = [
  { icon: <LayoutDashboard size={16} />, label: "marqueeKanban" },
  { icon: <Users size={16} />, label: "marqueeCollab" },
  { icon: <CheckCircle2 size={16} />, label: "marqueeSubtasks" },
  { icon: <Bell size={16} />, label: "marqueeNotifications" },
  { icon: <Tags size={16} />, label: "marqueeLabels" },
  { icon: <Paperclip size={16} />, label: "marqueeAttachments" },
  { icon: <Calendar size={16} />, label: "marqueeDueDates" },
  { icon: <BarChart2 size={16} />, label: "marqueeProgress" },
  { icon: <ListTodo size={16} />, label: "marqueeListView" },
  { icon: <Zap size={16} />, label: "marqueeRealtime" },
] as const;
