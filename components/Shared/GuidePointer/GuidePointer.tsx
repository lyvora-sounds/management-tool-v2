"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GuidePointerProps } from "./GuidePointer.types";

/** Aire entre el anillo y el elemento. */
const RING_PADDING = 6;
/** Separación entre el anillo y la tarjeta. */
const GAP = 28;
const CARD_WIDTH = 292;
const MARGIN = 12;

type Rect = { top: number; left: number; width: number; height: number };

/**
 * Rect en coordenadas de viewport, no de documento: todo se pinta con
 * position:fixed dentro de un portal a <body>, así que el scroll no entra en
 * la cuenta y ninguna transform de un ancestro puede descolocarlo.
 */
function readRect(target: string): Rect | null {
  const el = document.querySelector<HTMLElement>(`[data-guide="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function GuidePointer({ target, title, body, cta, onDismiss }: GuidePointerProps) {
  const [rect, setRect] = useState<Rect | null>(null);
  const [gone, setGone] = useState(false);

  const dismiss = useCallback(() => {
    setGone(true);
    // Deja terminar la salida antes de avisar arriba.
    window.setTimeout(onDismiss, 200);
  }, [onDismiss]);

  // El elemento puede no existir todavía: se acaba de navegar, o lo pinta un
  // componente cliente que aún no ha montado. Se sondea hasta que aparece.
  useEffect(() => {
    let frame = 0;
    let cancelled = false;
    const deadline = performance.now() + 8000;

    const tick = () => {
      if (cancelled) return;
      const next = readRect(target);
      setRect(next);
      if (!next && performance.now() > deadline) return; // nunca apareció
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [target]);

  // Si el usuario hace lo que se le pide, la ayuda sobra.
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(`[data-guide="${target}"]`);
    if (!el) return;
    el.addEventListener("click", dismiss, { once: true });
    return () => el.removeEventListener("click", dismiss);
  }, [target, rect, dismiss]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismiss();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismiss]);

  if (typeof document === "undefined" || !rect || gone) return null;

  const ring = {
    top: rect.top - RING_PADDING,
    left: rect.left - RING_PADDING,
    width: rect.width + RING_PADDING * 2,
    height: rect.height + RING_PADDING * 2,
  };

  // La tarjeta va debajo si cabe, y si no encima. Centrada sobre el objetivo
  // pero sin salirse por los bordes.
  const below = window.innerHeight - (ring.top + ring.height) > 190;
  const cardTop = below
    ? ring.top + ring.height + GAP
    : Math.max(MARGIN, ring.top - 168 - GAP);
  const cardLeft = Math.min(
    Math.max(MARGIN, ring.left + ring.width / 2 - CARD_WIDTH / 2),
    window.innerWidth - CARD_WIDTH - MARGIN
  );

  // Flecha curva de la tarjeta al elemento. El punto de control se desplaza en
  // perpendicular para que el trazo salga con curva, no como una recta.
  const from = { x: cardLeft + CARD_WIDTH / 2, y: below ? cardTop - 6 : cardTop + 162 };
  const to = {
    x: ring.left + ring.width / 2,
    y: below ? ring.top + ring.height + 4 : ring.top - 4,
  };
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  const control = { x: mid.x + (to.y - from.y) * 0.32, y: mid.y - (to.x - from.x) * 0.32 };

  // Punta: se orienta según la tangente de la curva en el extremo.
  const angle = (Math.atan2(to.y - control.y, to.x - control.x) * 180) / Math.PI;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="guide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        // Sin capa que bloquee: el usuario tiene que poder pulsar el botón real.
        className="pointer-events-none fixed inset-0 z-[90]"
      >
        {/* Latido alrededor del elemento */}
        <motion.span
          className="absolute rounded-lg ring-2 ring-primary"
          animate={{
            top: ring.top,
            left: ring.left,
            width: ring.width,
            height: ring.height,
            opacity: [0.9, 0.45, 0.9],
          }}
          transition={{
            top: { type: "spring", stiffness: 420, damping: 36 },
            left: { type: "spring", stiffness: 420, damping: 36 },
            opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          }}
        />
        <motion.span
          className="absolute rounded-lg bg-primary/10"
          animate={{
            top: ring.top,
            left: ring.left,
            width: ring.width,
            height: ring.height,
            scale: [1, 1.06, 1],
          }}
          transition={{
            type: "spring",
            stiffness: 420,
            damping: 36,
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          }}
        />

        <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <motion.path
            d={`M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`}
            fill="none"
            stroke="currentColor"
            className="text-primary"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="0 1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          />
          <motion.polygon
            points="0,-5 11,0 0,5"
            className="fill-primary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.2 }}
            transform={`translate(${to.x} ${to.y}) rotate(${angle})`}
          />
        </svg>

        {/* Tarjeta: lo único que recibe clics */}
        <motion.div
          className="pointer-events-auto absolute w-[292px] rounded-xl border bg-popover p-4 shadow-xl"
          initial={{ opacity: 0, y: below ? -8 : 8 }}
          animate={{ opacity: 1, y: 0, top: cardTop, left: cardLeft }}
          transition={{ type: "spring", stiffness: 420, damping: 36 }}
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-semibold">{title}</h3>
            <button
              onClick={dismiss}
              aria-label={cta}
              className="-mt-0.5 -mr-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
          <div className="mt-3 flex justify-end">
            <Button size="sm" variant="ghost" onClick={dismiss}>
              {cta}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
