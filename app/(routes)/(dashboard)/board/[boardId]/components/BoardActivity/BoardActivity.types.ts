import type { ApiActivityLog } from "@/lib/api/types";

/** The part of an activity entry the panel shows, taken from the API contract. */
export type ActivityLog = Pick<ApiActivityLog, "id" | "type" | "message" | "createdAt">;

export interface BoardActivityProps {
  boardId: string;
  open: boolean;
  onClose: () => void;
}
