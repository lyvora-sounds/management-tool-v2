"use client";

import { InfoBubble } from "@/components/Shared/InfoBubble/InfoBubble";

type Props = {
  text: string;
  /** Prefer opening above the control (e.g. chat composer near the bottom edge). */
  side?: "top" | "bottom";
  /** Horizontal alignment of the bubble relative to the (i) button. */
  align?: "start" | "end";
};

/** Small (i) control that shows a short explanation on hover, focus, or click. */
export function FieldGroupInfoHint({
  text,
  side = "bottom",
  align = "start",
}: Props) {
  return <InfoBubble text={text} side={side} align={align} />;
}
