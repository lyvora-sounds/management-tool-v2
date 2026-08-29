export function isDoneList(title: string | null | undefined): boolean {
  const s = (title ?? "").toLowerCase().trim();
  return (
    s.includes("hecho") ||
    s.includes("done") ||
    s.includes("completad") ||
    s.includes("finaliz")
  );
}

export function isTodoList(title: string | null | undefined): boolean {
  const s = (title ?? "").toLowerCase().trim();
  return (
    s.includes("hacer") ||
    s.includes("todo") ||
    s.includes("to do") ||
    s.includes("pendient") ||
    s.includes("backlog")
  );
}

export function targetListForCompletion<T extends { id: string; title: string }>(
  lists: T[],
  currentListId: string,
  nextCompleted: boolean,
): T | null {
  const target = nextCompleted
    ? lists.find((l) => isDoneList(l.title))
    : (lists.find((l) => isTodoList(l.title)) ?? lists[0]);
  if (!target || target.id === currentListId) return null;
  return target;
}

export function getStatusTheme(title: string, completed?: boolean) {
  const s = (title ?? "").toLowerCase().trim();
  if (completed || isDoneList(title)) {
    return {
      bg: "bg-emerald-500/10 dark:bg-emerald-950/30",
      text: "text-emerald-700 dark:text-emerald-300",
      border: "border-emerald-500/30 dark:border-emerald-700/40",
      dot: "bg-emerald-500",
      isDone: true,
      label: title,
    };
  }
  if (
    s.includes("progres") ||
    s.includes("curso") ||
    s.includes("doing") ||
    s.includes("desarrollo") ||
    s.includes("progress")
  ) {
    return {
      bg: "bg-blue-500/10 dark:bg-blue-950/30",
      text: "text-blue-700 dark:text-blue-300",
      border: "border-blue-500/30 dark:border-blue-700/40",
      dot: "bg-blue-500",
      isDone: false,
      label: title,
    };
  }
  if (
    s.includes("revis") ||
    s.includes("review") ||
    s.includes("qa") ||
    s.includes("test") ||
    s.includes("evalua")
  ) {
    return {
      bg: "bg-purple-500/10 dark:bg-purple-950/30",
      text: "text-purple-700 dark:text-purple-300",
      border: "border-purple-500/30 dark:border-purple-700/40",
      dot: "bg-purple-500",
      isDone: false,
      label: title,
    };
  }
  if (isTodoList(title)) {
    return {
      bg: "bg-slate-500/10 dark:bg-slate-800/40",
      text: "text-slate-700 dark:text-slate-300",
      border: "border-slate-500/25 dark:border-slate-700/40",
      dot: "bg-slate-400 dark:bg-slate-500",
      isDone: false,
      label: title,
    };
  }
  return {
    bg: "bg-zinc-500/10 dark:bg-zinc-800/30",
    text: "text-zinc-700 dark:text-zinc-300",
    border: "border-zinc-500/20 dark:border-zinc-700/30",
    dot: "bg-zinc-400 dark:bg-zinc-500",
    isDone: false,
    label: title,
  };
}
