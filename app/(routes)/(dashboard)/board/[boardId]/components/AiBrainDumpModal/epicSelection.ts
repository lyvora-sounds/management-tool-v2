export function allTicketIndexes(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index);
}

export function toggleTicketIndex(selected: readonly number[], index: number): number[] {
  return selected.includes(index)
    ? selected.filter((item) => item !== index)
    : [...selected, index].sort((left, right) => left - right);
}

export function shiftSelection(selected: readonly number[], removedIndex: number): number[] {
  return selected
    .filter((index) => index !== removedIndex)
    .map((index) => (index > removedIndex ? index - 1 : index));
}

export function shiftCreatingFor(current: number | null, removedIndex: number): number | null {
  if (current === null || current === removedIndex) return null;
  return current > removedIndex ? current - 1 : current;
}

export function applyEpicToSelected<T extends { targetEpicId?: string | null }>(
  tasks: T[],
  selected: readonly number[],
  epicId: string,
): T[] {
  const chosen = new Set(selected);
  return tasks.map((task, index) =>
    chosen.has(index) ? { ...task, targetEpicId: epicId } : task,
  );
}
