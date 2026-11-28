import { cn } from "@/lib/utils";
import type { Priority } from "./TaskPriority.constants";

const LEVEL: Record<Priority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
const BAR_HEIGHTS = [4, 7, 10, 13];

/**
 * A small signal-strength mark for a priority: four bars, as many filled as the level. It says the same thing as
 * the text badge in a fraction of the width, and does not rely on colour alone (the number of bars carries it).
 */
export function PriorityMark({
  priority,
  label,
  className,
}: {
  priority: { value: Priority; color: string };
  label: string;
  className?: string;
}) {
  const level = LEVEL[priority.value];
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn("inline-flex h-[13px] shrink-0 items-end gap-[2px]", className)}
    >
      {BAR_HEIGHTS.map((height, index) => (
        <span
          key={index}
          aria-hidden
          className="w-[3px] rounded-[1px]"
          style={{
            height,
            backgroundColor: index < level ? priority.color : "currentColor",
            opacity: index < level ? 1 : 0.2,
          }}
        />
      ))}
    </span>
  );
}
