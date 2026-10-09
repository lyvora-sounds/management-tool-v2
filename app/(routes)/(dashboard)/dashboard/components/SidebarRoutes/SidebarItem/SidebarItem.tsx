"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { SidebarItemsProps } from "./SidebarItem.types"
import { cn } from "@/lib/utils"

type Props = {
  item: SidebarItemsProps
}

export function SidebarItem({ item }: Props) {
  const pathname = usePathname()
  const isActive = pathname === item.href

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition",
        isActive
          ? "workspace-nav-active font-medium text-primary"
          : "text-muted-foreground hover:bg-muted"
      )}
    >
      {item.icon}
      {item.label}
    </Link>
  )
}