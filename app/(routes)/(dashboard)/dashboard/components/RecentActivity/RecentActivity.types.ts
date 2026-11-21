import type { ActivityReference } from "@/lib/activityReferencesClient";

interface ActivityEntry {
  id: string;
  type: string;
  message: string;
  createdAt: Date;
  board: { id: string; title: string };
  user: { name: string | null };
  references?: ActivityReference[];
}

export interface RecentActivityProps {
  logs: ActivityEntry[];
}
