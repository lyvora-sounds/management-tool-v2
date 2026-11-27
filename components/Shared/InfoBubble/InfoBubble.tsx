"use client";

import type { ReactNode } from "react";
import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface InfoBubbleProps {
  /** Plain explanation text shown inside the bubble. */
  text?: string;
  /** Rich content (e.g. text with links) shown inside the bubble. */
  children?: ReactNode;
  /** Accessible label for the (i) trigger button; defaults to `text`. */
  label?: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  className?: string;
  contentClassName?: string;
}

/**
 * Compact (i) disclosure bubble that keeps explanatory helper copy out of the
 * main layout until hovered, focused, or tapped.
 */
export function InfoBubble({
  text,
  children,
  label,
  side = "bottom",
  align = "center",
  className,
  contentClassName,
}: InfoBubbleProps) {
  const body = children ?? text;
  if (!body) return null;

  const accessibleLabel = label ?? text ?? "More information";

  return (
    <Popover>
      <PopoverTrigger
        type="button"
        openOnHover
        delay={180}
        closeDelay={120}
        aria-label={accessibleLabel}
        onClick={(event) => {
          event.stopPropagation();
        }}
        className={cn(
          "inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground/75 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        <Info size={13} aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        sideOffset={6}
        onClick={(event) => {
          event.stopPropagation();
        }}
        className={cn(
          "w-68 max-w-[calc(100vw-2rem)] gap-1.5 rounded-xl p-3 text-xs leading-relaxed font-normal normal-case tracking-normal text-popover-foreground shadow-lg",
          contentClassName,
        )}
      >
        {body}
      </PopoverContent>
    </Popover>
  );
}
