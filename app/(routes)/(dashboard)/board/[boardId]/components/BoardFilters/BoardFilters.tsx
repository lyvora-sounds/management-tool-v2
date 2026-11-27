"use client";

import { X, Layers, Calendar, Archive, User, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  BoardFiltersProps,
  FilterArchive,
  FilterDueDate,
} from "./BoardFilters.types";
import { filterChipAppearance } from "./filterChipAppearance";

function getInitials(name: string | null | undefined, email: string) {
  if (name)
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  return email[0].toUpperCase();
}

export function BoardFilters({
  filters,
  onChange,
  availableLabels,
  availableEpics = [],
  availableQuarters = [],
  availableMembers = [],
}: BoardFiltersProps) {
  const t = useTranslations("filters");
  const tBoard = useTranslations("board");
  const tCommon = useTranslations("common");

  const ARCHIVE_OPTIONS: { value: FilterArchive; label: string }[] = [
    { value: "active", label: t("active") },
    { value: "archived", label: t("archived") },
    { value: "all", label: t("allWithArchive") },
  ];

  const DUE_OPTIONS: { value: FilterDueDate; label: string }[] = [
    { value: "all", label: t("anyDate") },
    { value: "overdue", label: t("overdue") },
    { value: "today", label: t("today") },
    { value: "week", label: t("thisWeek") },
    { value: "none", label: t("noDate") },
  ];

  // base-ui muestra el `value` en bruto (un id, «all», «week»…) si el Select no sabe cómo se
  // llama cada opción, porque el listado vive en un portal y no está montado mientras está cerrado.
  // `items` le da el texto de cada valor para pintarlo en el botón.
  const dueItems = Object.fromEntries(DUE_OPTIONS.map((opt) => [opt.value, opt.label]));
  const memberItems: Record<string, ReactNode> = {
    all: tBoard("allMembers"),
    unassigned: tBoard("unassigned"),
    ...Object.fromEntries(availableMembers.map((member) => [member.id, member.name ?? member.email])),
  };
  const quarterItems: Record<string, ReactNode> = {
    all: tBoard("allQuarters"),
    ...Object.fromEntries(availableQuarters.map((q) => [q, q])),
  };
  const epicItems: Record<string, ReactNode> = {
    all: tBoard("allEpics"),
    ...Object.fromEntries(
      availableEpics.map((ep) => [
        ep.id,
        <span key={ep.id} className="flex items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: ep.color }} />
          <span className="truncate">{ep.title}</span>
        </span>,
      ]),
    ),
  };

  const hasActiveFilters =
    filters.dueDate !== "all" ||
    filters.labelIds.length > 0 ||
    filters.archiveStatus !== "active" ||
    filters.quarter !== "all" ||
    filters.epicId !== "all" ||
    filters.memberId !== "all";

  const toggleLabel = (id: string) => {
    const next = filters.labelIds.includes(id)
      ? filters.labelIds.filter((l) => l !== id)
      : [...filters.labelIds, id];
    onChange({ ...filters, labelIds: next });
  };

  const reset = () =>
    onChange({
      dueDate: "all",
      labelIds: [],
      archiveStatus: "active",
      quarter: "all",
      epicId: "all",
      memberId: "all",
    });

  const memberChipLabel = () => {
    if (filters.memberId === "unassigned") return tBoard("unassigned");
    const member = availableMembers.find((m) => m.id === filters.memberId);
    return member?.name ?? member?.email ?? tBoard("member");
  };

  const epicChipLabel = () => {
    const epic = availableEpics.find((ep) => ep.id === filters.epicId);
    return epic?.title ?? tBoard("epicFilter");
  };

  const dueChipLabel = () =>
    DUE_OPTIONS.find((opt) => opt.value === filters.dueDate)?.label ?? filters.dueDate;

  const archiveChipLabel = () =>
    ARCHIVE_OPTIONS.find((opt) => opt.value === filters.archiveStatus)?.label ??
    filters.archiveStatus;

  return (
    <div data-tour="board-filters" className="flex flex-wrap items-center gap-2">
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 cursor-pointer"
              data-testid="board-filters-trigger"
            >
              <ListFilter size={13} />
              <span>{tBoard("filter")}</span>
              {hasActiveFilters && (
                <span className="size-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
                  {[
                    filters.archiveStatus !== "active",
                    filters.memberId !== "all",
                    filters.dueDate !== "all",
                    filters.quarter !== "all",
                    filters.epicId !== "all",
                    filters.labelIds.length > 0,
                  ].filter(Boolean).length}
                </span>
              )}
            </Button>
          }
        ></PopoverTrigger>
        <PopoverContent align="start" className="w-80 p-3 flex flex-col gap-3">
          <p className="text-sm font-semibold">{t("title")}</p>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              {t("archiveScope")}
            </span>
            <ToggleGroup
              value={[filters.archiveStatus]}
              onValueChange={(val: string[]) => {
                const next = val.find((v) => v !== filters.archiveStatus) ?? filters.archiveStatus;
                onChange({ ...filters, archiveStatus: next as FilterArchive });
              }}
              className="border rounded-full bg-background w-full justify-start flex-wrap"
            >
              {ARCHIVE_OPTIONS.map((opt) => (
                <ToggleGroupItem
                  key={opt.value}
                  value={opt.value}
                  className="text-xs h-8 px-2.5 gap-1"
                >
                  {opt.value === "archived" && <Archive size={11} />}
                  <span>{opt.label}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {availableMembers.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                {tBoard("member")}
              </span>
              <Select
                items={memberItems}
                value={filters.memberId}
                onValueChange={(val) => onChange({ ...filters, memberId: val ?? "all" })}
              >
                <SelectTrigger className="h-8 text-xs w-full gap-1.5 bg-background">
                  <User size={12} className="text-muted-foreground" />
                  <SelectValue placeholder={tBoard("member")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    {tBoard("allMembers")}
                  </SelectItem>
                  <SelectItem value="unassigned" className="text-xs text-muted-foreground">
                    {tBoard("unassigned")}
                  </SelectItem>
                  {availableMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id} className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[9px] font-semibold flex items-center justify-center">
                          {getInitials(member.name, member.email)}
                        </div>
                        <span>{member.name ?? member.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              {t("dueDate")}
            </span>
            <Select
              items={dueItems}
              value={filters.dueDate}
              onValueChange={(val) => onChange({ ...filters, dueDate: val as FilterDueDate })}
            >
              <SelectTrigger className="h-8 text-xs w-full bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DUE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {availableQuarters.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                {tBoard("quarter")}
              </span>
              <Select
                items={quarterItems}
                value={filters.quarter}
                onValueChange={(val) => onChange({ ...filters, quarter: val ?? "all" })}
              >
                <SelectTrigger className="h-8 text-xs w-full gap-1 bg-background">
                  <Calendar size={12} className="text-muted-foreground" />
                  <SelectValue placeholder={tBoard("quarter")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    {tBoard("allQuarters")}
                  </SelectItem>
                  {availableQuarters.map((q) => (
                    <SelectItem key={q} value={q} className="text-xs">
                      {q}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {availableEpics.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                {tBoard("epicFilter")}
              </span>
              <Select
                items={epicItems}
                value={filters.epicId}
                onValueChange={(val) => onChange({ ...filters, epicId: val ?? "all" })}
              >
                <SelectTrigger className="h-8 text-xs w-full gap-1 bg-background">
                  <Layers size={12} className="text-muted-foreground" />
                  <SelectValue placeholder={tBoard("epicFilter")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    {tBoard("allEpics")}
                  </SelectItem>
                  {availableEpics.map((ep) => (
                    <SelectItem key={ep.id} value={ep.id} className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: ep.color }}
                        />
                        <span>{ep.title}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {availableLabels.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                {t("labels")}
              </span>
              <div className="flex flex-wrap gap-1">
                {availableLabels.map((label) => {
                  const active = filters.labelIds.includes(label.id);
                  return (
                    <Badge
                      key={label.id}
                      onClick={() => toggleLabel(label.id)}
                      className={`cursor-pointer text-white transition-opacity text-xs ${
                        active ? "opacity-100 ring-2 ring-offset-1 ring-ring" : "opacity-45 hover:opacity-70"
                      }`}
                      style={{ backgroundColor: label.color }}
                    >
                      {label.title || tCommon("unnamed")}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="h-8 text-xs gap-1 text-muted-foreground self-start"
            >
              <X size={12} />
              {tCommon("clear")}
            </Button>
          )}
        </PopoverContent>
      </Popover>

      {filters.archiveStatus !== "active" && (() => {
        const chip = filterChipAppearance("archive");
        return (
          <Badge
            className={chip.className}
            style={chip.style}
            onClick={() => onChange({ ...filters, archiveStatus: "active" })}
          >
            {archiveChipLabel()}
            <X size={11} />
          </Badge>
        );
      })()}
      {filters.memberId !== "all" && (() => {
        const chip = filterChipAppearance("member");
        return (
          <Badge
            className={chip.className}
            style={chip.style}
            onClick={() => onChange({ ...filters, memberId: "all" })}
          >
            {memberChipLabel()}
            <X size={11} />
          </Badge>
        );
      })()}
      {filters.dueDate !== "all" && (() => {
        const chip = filterChipAppearance("due");
        return (
          <Badge
            className={chip.className}
            style={chip.style}
            onClick={() => onChange({ ...filters, dueDate: "all" })}
          >
            {dueChipLabel()}
            <X size={11} />
          </Badge>
        );
      })()}
      {filters.quarter !== "all" && (() => {
        const chip = filterChipAppearance("quarter");
        return (
          <Badge
            className={chip.className}
            style={chip.style}
            onClick={() => onChange({ ...filters, quarter: "all" })}
          >
            {filters.quarter}
            <X size={11} />
          </Badge>
        );
      })()}
      {filters.epicId !== "all" && (() => {
        const epic = availableEpics.find((ep) => ep.id === filters.epicId);
        const chip = filterChipAppearance("epic", epic?.color);
        return (
          <Badge
            className={chip.className}
            style={chip.style}
            onClick={() => onChange({ ...filters, epicId: "all" })}
          >
            {epicChipLabel()}
            <X size={11} />
          </Badge>
        );
      })()}
      {filters.labelIds.map((id) => {
        const label = availableLabels.find((l) => l.id === id);
        if (!label) return null;
        const chip = filterChipAppearance("label", label.color);
        return (
          <Badge
            key={id}
            className={chip.className}
            style={chip.style}
            onClick={() => toggleLabel(id)}
          >
            {label.title || tCommon("unnamed")}
            <X size={11} />
          </Badge>
        );
      })}

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={reset} className="h-8 text-xs gap-1 text-muted-foreground">
          <X size={12} />
          {tCommon("clear")}
        </Button>
      )}
    </div>
  );
}
