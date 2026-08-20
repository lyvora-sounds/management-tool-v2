export type FilterStatus = "all" | "pending" | "completed";
export type FilterDueDate = "all" | "overdue" | "today" | "week" | "none";
export type FilterArchive = "active" | "archived" | "all";

export type BoardFiltersState = {
  status: FilterStatus;
  dueDate: FilterDueDate;
  labelIds: string[];
  archiveStatus: FilterArchive;
  quarter: string; // "all" or specific quarter e.g. "2026-Q1"
  epicId: string; // "all" or specific epicId
};

export type BoardFiltersProps = {
  filters: BoardFiltersState;
  onChange: (filters: BoardFiltersState) => void;
  availableLabels: { id: string; title: string; color: string }[];
  availableEpics?: { id: string; title: string; color: string }[];
  availableQuarters?: string[];
};

