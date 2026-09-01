"use client";

import { X, Layers, Calendar, Archive, User } from "lucide-react";
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
import { useTranslations } from "next-intl";
import {
  BoardFiltersProps,
  FilterArchive,
  FilterDueDate,
  FilterStatus,
} from "./BoardFilters.types";

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

  const STATUS_OPTIONS: { value: FilterStatus; label: string }[] = [
    { value: "all", label: t("all") },
    { value: "pending", label: t("pending") },
    { value: "completed", label: t("completed") },
  ];

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
  const hasActiveFilters =
    filters.status !== "all" ||
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
      status: "all",
      dueDate: "all",
      labelIds: [],
      archiveStatus: "active",
      quarter: "all",
      epicId: "all",
      memberId: "all",
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Active vs Archived Toggle */}
      <ToggleGroup
        value={[filters.archiveStatus]}
        onValueChange={(val: string[]) => {
          const next = val.find((v) => v !== filters.archiveStatus) ?? filters.archiveStatus;
          onChange({ ...filters, archiveStatus: next as FilterArchive });
        }}
        className="border rounded-full bg-background"
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

      {/* Status (Pending / Completed) */}
      <ToggleGroup
        value={[filters.status]}
        onValueChange={(val: string[]) => {
          const next = val.find((v) => v !== filters.status) ?? filters.status;
          onChange({ ...filters, status: next as FilterStatus });
        }}
        className="border rounded-full bg-background"
      >
        {STATUS_OPTIONS.map((opt) => (
          <ToggleGroupItem key={opt.value} value={opt.value} className="text-xs h-8 px-3">
            {opt.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {/* Member Filter (including Admin and members) */}
      {availableMembers.length > 0 && (
        <Select
          value={filters.memberId}
          onValueChange={(val) => onChange({ ...filters, memberId: val ?? "all" })}
        >
          <SelectTrigger className="h-8 text-xs w-auto min-w-32 gap-1.5 bg-background">
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
      )}

      {/* Due date */}
      <Select
        value={filters.dueDate}
        onValueChange={(val) => onChange({ ...filters, dueDate: val as FilterDueDate })}
      >
        <SelectTrigger className="h-8 text-xs w-auto min-w-32 bg-background">
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

      {/* Quarter filter */}
      {availableQuarters.length > 0 && (
        <Select
          value={filters.quarter}
          onValueChange={(val) => onChange({ ...filters, quarter: val ?? "all" })}
        >
          <SelectTrigger className="h-8 text-xs w-auto min-w-28 gap-1 bg-background">
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
      )}

      {/* Epic filter */}
      {availableEpics.length > 0 && (
        <Select
          value={filters.epicId}
          onValueChange={(val) => onChange({ ...filters, epicId: val ?? "all" })}
        >
          <SelectTrigger className="h-8 text-xs w-auto min-w-28 gap-1 bg-background">
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
      )}

      {/* Labels */}
      {availableLabels.length > 0 && (
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
      )}

      {/* Reset */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={reset} className="h-8 text-xs gap-1 text-muted-foreground">
          <X size={12} />
          {tCommon("clear")}
        </Button>
      )}
    </div>
  );
}


