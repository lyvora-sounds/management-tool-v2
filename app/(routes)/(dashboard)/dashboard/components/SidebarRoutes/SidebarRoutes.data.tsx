import { SidebarItemsProps } from "./SidebarItem/SidebarItem.types"
import { CalendarDays, CheckSquare, Home, Settings } from "lucide-react"

export const sidebarRoutes: SidebarItemsProps[] = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: <Home size={18} />
    },
    {
        label: "Mis tasks",
        href: "/dashboard/tasks",
        icon: <CheckSquare size={18} />
    },
    {
        label: "Calendario",
        href: "/dashboard/calendar",
        icon: <CalendarDays size={18} />
    },
]

// Vive en el pie del sidebar, junto al bloque de usuario, no en la
// navegación principal.
export const settingsRoute: SidebarItemsProps = {
    label: "Ajustes",
    href: "/dashboard/settings",
    icon: <Settings size={18} />
}