export type TaskDatePickerProps = {
  taskId: string;
  listId: string;
  startDate: Date | null;
  dueDate: Date | null;
  hideTrigger?: boolean;
  /** Return false to block the PATCH (e.g. quarter date mismatch). */
  beforeSave?: (startDate: Date | null, dueDate: Date | null) => boolean;
  onSaved?: (startDate: Date | null, dueDate: Date | null) => void;
};
