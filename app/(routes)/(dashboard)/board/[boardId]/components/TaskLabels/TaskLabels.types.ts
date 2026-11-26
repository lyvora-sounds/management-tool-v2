import type { LabelModel } from "@/lib/modelTypes";

export type TaskLabelsProps = {
  taskId: string;
  boardId: string;
  activeLabels: { label: LabelModel }[];
  onLabelsChange?: (active: { label: LabelModel }[]) => void;
};
