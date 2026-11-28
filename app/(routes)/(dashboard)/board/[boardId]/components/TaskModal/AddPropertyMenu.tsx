"use client";

import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type AddPropertyItem = {
  key: string;
  label: string;
  icon: ReactNode;
  /** Built-in properties of the ticket come first; the board's custom fields go under their own heading. */
  group: "ticket" | "custom";
};

/**
 * The one way to add a property the ticket does not have yet. Properties with a value are always shown; the rest
 * wait here instead of taking a row each. Nothing renders when there is nothing to add (a viewer, or a ticket
 * that already has everything).
 */
export function AddPropertyMenu({
  items,
  onSelect,
}: {
  items: AddPropertyItem[];
  onSelect: (key: string) => void;
}) {
  const t = useTranslations("task");
  if (items.length === 0) return null;

  const ticketItems = items.filter((item) => item.group === "ticket");
  const customItems = items.filter((item) => item.group === "custom");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("addProperty")}
        className="inline-flex h-8 w-fit cursor-pointer items-center gap-1.5 rounded-md border border-dashed px-2.5 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground pointer-coarse:h-11"
      >
        <Plus size={14} aria-hidden />
        <span>{t("addProperty")}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {ticketItems.map((item) => (
          <DropdownMenuItem
            key={item.key}
            onClick={() => onSelect(item.key)}
            className="cursor-pointer gap-2 text-sm pointer-coarse:min-h-11"
          >
            <span className="text-muted-foreground">{item.icon}</span>
            {item.label}
          </DropdownMenuItem>
        ))}
        {customItems.length > 0 && (
          <>
            {ticketItems.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("customFields")}
            </DropdownMenuLabel>
            {customItems.map((item) => (
              <DropdownMenuItem
                key={item.key}
                onClick={() => onSelect(item.key)}
                className="cursor-pointer gap-2 text-sm pointer-coarse:min-h-11"
              >
                <span className="text-muted-foreground">{item.icon}</span>
                {item.label}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
