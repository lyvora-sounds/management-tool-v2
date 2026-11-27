import { BoardFiltersState } from "../BoardFilters/BoardFilters.types";

export const DEFAULT_FILTERS: BoardFiltersState = {
  dueDate: "all",
  labelIds: [],
  archiveStatus: "active",
  quarter: "all",
  epicId: "all",
  memberId: "all",
};
