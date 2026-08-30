import {
  Bell,
  CheckCircle2,
  UserCircle,
  MessageSquare,
} from "lucide-react";

export const tasks = [
  { title: "task1", list: "task1List", done: false },
  { title: "task2", list: "task2List", done: false },
  { title: "task3", list: "task3List", done: true },
  { title: "task4", list: "task4List", done: false },
  { title: "task5", list: "task5List", done: false },
  { title: "task6", list: "task6List", done: true },
] as const;

export const notifications = [
  {
    icon: <UserCircle size={14} />,
    msg: "notif1",
    time: "timeNow",
  },
  {
    icon: <MessageSquare size={14} />,
    msg: "notif2",
    time: "time1min",
  },
  {
    icon: <CheckCircle2 size={14} />,
    msg: "notif3",
    time: "time3min",
  },
  {
    icon: <Bell size={14} />,
    msg: "notif4",
    time: "time5min",
  },
  {
    icon: <UserCircle size={14} />,
    msg: "notif5",
    time: "time10min",
  },
] as const;

export const members = [
  { name: "Ana", color: "bg-violet-500" },
  { name: "Luis", color: "bg-blue-500" },
  { name: "Sara", color: "bg-emerald-500" },
  { name: "Carlos", color: "bg-orange-500" },
];

export const bars = [40, 70, 50, 90, 60, 80, 45];

export const labels = [
  { text: "labelUrgent", color: "bg-red-500" },
  { text: "labelHigh", color: "bg-orange-400" },
  { text: "labelDesign", color: "bg-violet-500" },
  { text: "labelDev", color: "bg-blue-500" },
  { text: "labelMedium", color: "bg-yellow-400" },
  { text: "labelQa", color: "bg-teal-500" },
  { text: "labelLow", color: "bg-slate-400" },
  { text: "labelMarketing", color: "bg-pink-500" },
] as const;

export const highlighted = [4, 9, 14, 18, 22, 27];

export const subtasks = [
  { label: "sub1", done: true },
  { label: "sub2", done: true },
  { label: "sub3", done: false },
  { label: "sub4", done: false },
  { label: "sub5", done: false },
] as const;
