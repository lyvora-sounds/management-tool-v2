import {
  Zap,
  ShieldCheck,
  Clock,
  TrendingUp,
  Users,
  BarChart2,
  CheckCircle2,
  Globe,
} from "lucide-react";

export const mainStats = [
  {
    value: 10000,
    suffix: "+",
    label: "tasksLabel",
    desc: "tasksDesc",
  },
  {
    value: 500,
    suffix: "+",
    label: "teamsLabel",
    desc: "teamsDesc",
  },
  {
    value: 99,
    suffix: "%",
    label: "uptimeLabel",
    desc: "uptimeDesc",
  },
  {
    value: 2,
    suffix: "min",
    label: "startLabel",
    desc: "startDesc",
  },
] as const;

export const benefits = [
  {
    Icon: Zap,
    title: "speedTitle",
    value: "3×",
    desc: "speedDesc",
  },
  {
    Icon: TrendingUp,
    title: "deliveryTitle",
    value: "87%",
    desc: "deliveryDesc",
  },
  {
    Icon: Users,
    title: "adoptionTitle",
    value: "94%",
    desc: "adoptionDesc",
  },
  {
    Icon: BarChart2,
    title: "completedTitle",
    value: "+40%",
    desc: "completedDesc",
  },
  {
    Icon: Clock,
    title: "timeTitle",
    value: "5h/sem",
    desc: "timeDesc",
  },
  {
    Icon: CheckCircle2,
    title: "errorsTitle",
    value: "60%",
    desc: "errorsDesc",
  },
] as const;

export const pillars = [
  {
    Icon: ShieldCheck,
    title: "securityTitle",
    points: ["securityP1", "securityP2", "securityP3", "securityP4"],
  },
  {
    Icon: Globe,
    title: "availableTitle",
    points: ["availableP1", "availableP2", "availableP3", "availableP4"],
  },
  {
    Icon: Zap,
    title: "perfTitle",
    points: ["perfP1", "perfP2", "perfP3", "perfP4"],
  },
] as const;
