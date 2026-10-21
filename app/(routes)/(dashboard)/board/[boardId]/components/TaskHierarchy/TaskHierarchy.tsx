"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, GitBranch } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { getStatusTheme } from "@/lib/statusTheme";
import { hierarchyRanks, type HierarchyNode } from "@/lib/hierarchyDiagram";

const OPEN_KEY = "kiki.hierarchy.open";

function initialOpen() {
  try {
    return localStorage.getItem(OPEN_KEY) === "1";
  } catch {
    return false;
  }
}

function StepRow({ node, current, onNavigate }: { node: HierarchyNode; current?: boolean; onNavigate: (taskId: string) => void }) {
  const t = useTranslations("task");
  return (
    <button
      type="button"
      onClick={() => onNavigate(node.id)}
      aria-current={current ? "step" : undefined}
      className={cn(
        "flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted",
        current && "bg-primary/10 ring-1 ring-primary/30",
        node.archived && "opacity-60",
      )}
    >
      {node.completed ? (
        <Check size={14} className="mt-0.5 shrink-0 text-emerald-500" aria-label={t("hierarchyDone")} />
      ) : (
        <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", getStatusTheme(node.listTitle ?? "").dot)} aria-hidden />
      )}
      <span className="min-w-0 flex-1">
        <span className={cn("block text-sm leading-snug", current && "font-semibold", node.completed && "text-muted-foreground")}>{node.title}</span>
        {node.listTitle && <span className="block text-[11px] text-muted-foreground">{node.listTitle}</span>}
      </span>
    </button>
  );
}

/**
 * Recorrido del ticket: de qué raíz cuelga y en qué paso está. Va plegado por defecto, con el paso actual y
 * una barra de avance en la cabecera, para no ocupar el modal; desplegado muestra todos los pasos con su
 * título completo y se puede saltar a cualquiera.
 */
export function TaskHierarchy({
  focusId,
  nodes,
  onNavigate,
}: {
  focusId: string;
  nodes: HierarchyNode[];
  onNavigate: (taskId: string) => void;
}) {
  const t = useTranslations("task");
  const [open, setOpen] = useState(initialOpen);
  const layout = useMemo(() => hierarchyRanks(nodes, focusId), [nodes, focusId]);
  if (!layout || !layout.ranks.length) return null;

  const { root, ranks, cyclic } = layout;
  const currentRank = ranks.findIndex((rank) => rank.some((node) => node.id === focusId));
  const isRoot = !cyclic && root.id === focusId;
  const summary = isRoot ? t("hierarchyOrigin", { count: ranks.length }) : t("hierarchyStep", { step: currentRank + 1, total: ranks.length });

  const toggle = () => {
    const next = !open;
    setOpen(next);
    try {
      localStorage.setItem(OPEN_KEY, next ? "1" : "0");
    } catch {
      // Sin almacenamiento: el estado solo dura mientras el modal está abierto.
    }
  };

  return (
    <section className="shrink-0 rounded-xl border bg-muted/20" aria-label={t("hierarchyTitle")}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <GitBranch size={15} className="shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="text-xs font-semibold">{t("hierarchyTitle")}</span>
            <span className="truncate text-xs text-muted-foreground">{root.title}</span>
          </span>
          <span className="mt-1.5 flex gap-1" aria-hidden>
            {ranks.map((rank, index) => (
              <span
                key={index}
                className={cn(
                  "h-1 flex-1 rounded-full",
                  index === currentRank ? "bg-primary" : rank.every((node) => node.completed) ? "bg-emerald-500" : "bg-muted-foreground/25",
                )}
              />
            ))}
          </span>
        </span>
        <span className="shrink-0 rounded-full bg-background px-2 py-0.5 text-[11px] font-medium tabular-nums ring-1 ring-border">{summary}</span>
        <ChevronDown size={15} className={cn("shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="max-h-72 overflow-y-auto border-t px-2 py-2">
          <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("hierarchyOriginLabel")}</p>
          <StepRow node={root} current={isRoot} onNavigate={onNavigate} />
          <ol className="mt-1">
            {ranks.map((rank, index) => (
              <li key={index} className="relative flex gap-2 pt-1">
                <span className="relative z-10 mt-1.5 grid size-6 shrink-0 place-items-center rounded-md border bg-background font-mono text-[10px] tabular-nums text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {index < ranks.length - 1 && <span aria-hidden className="absolute left-3 top-8 -bottom-1 w-px bg-border" />}
                <div className="min-w-0 flex-1">
                  {rank.map((node) => (
                    <StepRow key={node.id} node={node} current={node.id === focusId} onNavigate={onNavigate} />
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
