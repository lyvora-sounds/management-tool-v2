"use client";

import { useTranslations } from "next-intl";
import { CalendarDays, CheckSquare, Home } from "lucide-react";
import { SidebarItem } from "./SidebarItem/SidebarItem";
import { BoardsSection } from "./BoardsSection/BoardsSection";

export function SidebarRoutes() {
  const t = useTranslations("sidebar");

  const routes = [
    {
      label: t("dashboard"),
      href: "/dashboard",
      icon: <Home size={18} />,
    },
    {
      label: t("myTasks"),
      href: "/dashboard/tasks",
      icon: <CheckSquare size={18} />,
    },
    {
      label: t("calendar"),
      href: "/dashboard/calendar",
      icon: <CalendarDays size={18} />,
    },
  ];

  return (
    <div className="flex flex-col gap-1">
      {routes.map((item) => (
        <SidebarItem key={item.href} item={item} />
      ))}
      <BoardsSection />
    </div>
  );
}
