"use client";

import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import {
  Check,
  Circle,
  Crown,
  Shield,
  UserCheck,
  Sparkles,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FlowStep } from "../data";

/**
 * Maquetas de la interfaz real, dibujadas con los mismos tokens de color que
 * la app. Son adorno: `aria-hidden` para que un lector de pantalla lea el
 * texto del paso y no una sopa de cajas sin sentido.
 */
export function FlowVisual({ visual }: { visual: FlowStep["visual"] }) {
  const t = useTranslations("howItWorks.visuals");

  const frame =
    "relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm";

  if (visual === "board") {
    const boards = [
      { name: t("boardA"), color: "bg-violet-500", pct: 72 },
      { name: t("boardB"), color: "bg-blue-500", pct: 40 },
      { name: t("boardC"), color: "bg-emerald-500", pct: 95 },
    ];
    return (
      <div className={cn(frame, "flex flex-col gap-2.5")} aria-hidden>
        {boards.map((b, i) => (
          <motion.div
            key={b.name}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="flex items-center gap-3 rounded-xl border bg-background/60 p-3"
          >
            <span className={cn("size-8 shrink-0 rounded-lg", b.color)} />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">{b.name}</p>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${b.pct}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.7 }}
                />
              </div>
            </div>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {b.pct}%
            </span>
          </motion.div>
        ))}
      </div>
    );
  }

  if (visual === "lists") {
    const columns = [
      { title: t("todo"), items: [t("ticket1"), t("ticket2")], done: false },
      { title: t("doing"), items: [t("ticket3")], done: false },
      { title: t("done"), items: [t("ticket4")], done: true },
    ];
    return (
      <div className={cn(frame, "grid grid-cols-3 gap-2")} aria-hidden>
        {columns.map((col, i) => (
          <motion.div
            key={col.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: i * 0.12, duration: 0.4 }}
            className="flex flex-col gap-2 rounded-xl bg-muted/60 p-2"
          >
            <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {col.title}
            </p>
            {col.items.map((item) => (
              <div
                key={item}
                className="flex items-start gap-1.5 rounded-lg border bg-background p-2"
              >
                {col.done ? (
                  <Check size={11} className="mt-0.5 shrink-0 text-primary" />
                ) : (
                  <Circle size={11} className="mt-0.5 shrink-0 text-muted-foreground" />
                )}
                <span
                  className={cn(
                    "text-[11px] leading-tight",
                    col.done && "text-muted-foreground line-through"
                  )}
                >
                  {item}
                </span>
              </div>
            ))}
          </motion.div>
        ))}
      </div>
    );
  }

  if (visual === "team") {
    const people = [
      { name: "Ana", role: t("roleOwner"), Icon: Crown, tone: "text-amber-500" },
      { name: "Luis", role: t("roleAdmin"), Icon: Shield, tone: "text-blue-600" },
      { name: "Sara", role: t("roleMember"), Icon: UserCheck, tone: "text-emerald-600" },
    ];
    return (
      <div className={cn(frame, "flex flex-col gap-2")} aria-hidden>
        {people.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, x: 12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="flex items-center gap-2.5 rounded-xl border bg-background/60 px-3 py-2.5"
          >
            <p.Icon size={15} className={cn("shrink-0", p.tone)} />
            <span className="flex-1 text-sm font-medium">{p.name}</span>
            <span className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">
              {p.role}
            </span>
          </motion.div>
        ))}
      </div>
    );
  }

  if (visual === "ai") {
    return (
      <div className={cn(frame, "flex flex-col gap-3")} aria-hidden>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4 }}
          className="rounded-xl border bg-background/60 p-3"
        >
          <div className="mb-1.5 flex items-center gap-1.5 text-primary">
            <Sparkles size={12} />
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              {t("brainDump")}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {t("brainDumpText")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35, duration: 0.3 }}
          className="flex justify-center text-muted-foreground"
        >
          <ArrowDown size={14} />
        </motion.div>

        <div className="flex flex-col gap-1.5">
          {[t("aiOut1"), t("aiOut2"), t("aiOut3")].map((item, i) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 + i * 0.12, duration: 0.35 }}
              className="flex items-center gap-2 rounded-lg border bg-background p-2"
            >
              <Circle size={10} className="shrink-0 text-muted-foreground" />
              <span className="text-[11px]">{item}</span>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // metrics
  const bars = [45, 70, 55, 90, 65, 80, 50];
  return (
    <div className={cn(frame, "flex flex-col gap-4")} aria-hidden>
      <div className="flex items-end justify-between gap-1.5 h-28">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-t-md bg-primary/70"
            initial={{ height: 0 }}
            whileInView={{ height: `${h}%` }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: i * 0.06, duration: 0.5, ease: "easeOut" }}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 border-t pt-3">
        {[
          { label: t("metricDone"), value: "128" },
          { label: t("metricOpen"), value: "24" },
          { label: t("metricOverdue"), value: "3" },
        ].map((m) => (
          <div key={m.label} className="flex flex-col">
            <span className="text-lg font-semibold tabular-nums">{m.value}</span>
            <span className="text-[10px] text-muted-foreground">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
