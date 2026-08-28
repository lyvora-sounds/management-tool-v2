export const PRIORITY_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  urgent: {
    label: "Urgente",
    bg: "bg-red-500/10 dark:bg-red-950/30",
    text: "text-red-700 dark:text-red-300",
    dot: "bg-red-500",
  },
  high: {
    label: "Alta",
    bg: "bg-orange-500/10 dark:bg-orange-950/30",
    text: "text-orange-700 dark:text-orange-300",
    dot: "bg-orange-500",
  },
  medium: {
    label: "Media",
    bg: "bg-amber-500/10 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  low: {
    label: "Baja",
    bg: "bg-emerald-500/10 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
};

export function formatDueDate(date: Date | string): {
  label: string;
  variant: "destructive" | "secondary" | "outline";
  isOverdue: boolean;
  isToday: boolean;
  isSoon: boolean;
} {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(date);
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) {
    return {
      label: `Venció hace ${Math.abs(diffDays)}d`,
      variant: "destructive",
      isOverdue: true,
      isToday: false,
      isSoon: false,
    };
  }
  if (diffDays === 0) {
    return {
      label: "Hoy",
      variant: "outline",
      isOverdue: false,
      isToday: true,
      isSoon: true,
    };
  }
  if (diffDays === 1) {
    return {
      label: "Mañana",
      variant: "secondary",
      isOverdue: false,
      isToday: false,
      isSoon: true,
    };
  }
  if (diffDays <= 7) {
    return {
      label: `En ${diffDays} días`,
      variant: "secondary",
      isOverdue: false,
      isToday: false,
      isSoon: true,
    };
  }
  return {
    label: due.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    }),
    variant: "secondary",
    isOverdue: false,
    isToday: false,
    isSoon: false,
  };
}
