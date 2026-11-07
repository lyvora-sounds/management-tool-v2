"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  /** Prefer opening above the control (e.g. chat composer near the bottom edge). */
  side?: "top" | "bottom";
  /** Horizontal alignment of the tooltip relative to the (i) button. */
  align?: "start" | "end";
};

/** Small (i) control that shows a short explanation on click. */
export function FieldGroupInfoHint({
  text,
  side = "bottom",
  align = "start",
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-expanded={open}
        aria-label={text}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Info size={13} aria-hidden />
      </button>
      <span
        role="tooltip"
        hidden={!open}
        className={cn(
          "absolute z-30 w-64 rounded-md bg-foreground px-2.5 py-1.5 text-left text-xs leading-relaxed font-normal normal-case tracking-normal text-background shadow-md",
          side === "top" ? "bottom-full mb-1" : "top-full mt-1",
          align === "end" ? "right-0" : "left-0",
        )}
      >
        {text}
      </span>
    </span>
  );
}
