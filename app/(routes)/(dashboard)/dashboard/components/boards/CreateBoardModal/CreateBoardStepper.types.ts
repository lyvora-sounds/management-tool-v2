export interface BoardFormData {
  title: string;
  description: string;
  color: string;
  lists: string[];
  organizationId: string;
}

export interface StepProps {
  data: BoardFormData;
  onChange: (patch: Partial<BoardFormData>) => void;
}

export const DEFAULT_LISTS = ["Por hacer", "En progreso", "Hecho"];

export const PRESET_COLORS = [
  { label: "Slate",   value: "#64748b" },
  { label: "Red",     value: "#ef4444" },
  { label: "Orange",  value: "#f97316" },
  { label: "Amber",   value: "#f59e0b" },
  { label: "Emerald", value: "#10b981" },
  { label: "Sky",     value: "#0ea5e9" },
  { label: "Violet",  value: "#8b5cf6" },
  { label: "Pink",    value: "#ec4899" },
];
