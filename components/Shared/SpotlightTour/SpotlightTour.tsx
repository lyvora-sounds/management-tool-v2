"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SpotlightTourProps, TourStep } from "./SpotlightTour.types";

/** Hueco entre el recorte y el elemento, para que respire. */
const PADDING = 8;
/** Separación entre el recorte y el globo de texto. */
const GAP = 12;
const CARD_WIDTH = 320;
/** Alto estimado del globo, solo para decidir si cabe arriba o abajo. */
const CARD_HEIGHT_ESTIMATE = 168;

type Rect = { top: number; left: number; width: number; height: number };

function readRect(target: string): Rect | null {
  const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  // Un elemento montado pero con caja nula (display:none, un panel cerrado) no
  // se puede señalar: se trata igual que si no estuviera.
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function SpotlightTour({ steps, open, onFinish, labels }: SpotlightTourProps) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  // Solo los pasos cuyo elemento existe de verdad en esta pantalla. Un tablero
  // sin listas, o un móvil que esconde media cabecera, dejan fuera varios.
  const [visibleSteps, setVisibleSteps] = useState<TourStep[]>([]);

  useLayoutEffect(() => {
    if (!open) return;
    // set-state-in-effect: medir el DOM solo se puede después de pintarlo, así
    // que este estado no se puede derivar durante el render. Es un render extra
    // al abrir el tour y ninguno más.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleSteps(steps.filter((s) => readRect(s.target) !== null));
  }, [open, steps]);

  const step = visibleSteps[index];

  const sync = useCallback(() => {
    if (!step) return;
    setRect(readRect(step.target));
  }, [step]);

  useLayoutEffect(() => {
    if (!open || !step) return;

    const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });

    // Misma razón que arriba: la posición del recorte sale de
    // getBoundingClientRect, que no existe hasta que hay algo pintado.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    sync();

    // El scroll suave tarda, y durante ese rato el recorte iría por detrás del
    // elemento. Se re-mide en cada frame mientras dure la animación.
    let frame = 0;
    const until = performance.now() + 600;
    const tick = () => {
      sync();
      if (performance.now() < until) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync, true);
    };
  }, [open, step, sync]);

  const finish = useCallback(() => {
    setIndex(0);
    onFinish();
  }, [onFinish]);

  const next = useCallback(() => {
    if (index >= visibleSteps.length - 1) finish();
    else setIndex((i) => i + 1);
  }, [index, visibleSteps.length, finish]);

  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, finish, next, back]);

  // Con el tour abierto la página no debe poder desplazarse por detrás.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // `open` arranca en false y solo lo enciende un efecto, así que el servidor
  // siempre renderiza null y no hay desajuste de hidratación que arreglar con
  // un estado "mounted". El guard de document es por si alguien lo monta con
  // open ya en true.
  if (typeof document === "undefined" || !open || !step || !rect) return null;

  const hole = {
    top: rect.top - PADDING,
    left: rect.left - PADDING,
    width: rect.width + PADDING * 2,
    height: rect.height + PADDING * 2,
  };

  const roomBelow = window.innerHeight - (hole.top + hole.height);
  const placeBelow = roomBelow > CARD_HEIGHT_ESTIMATE + GAP;

  const cardTop = placeBelow
    ? hole.top + hole.height + GAP
    : Math.max(GAP, hole.top - CARD_HEIGHT_ESTIMATE - GAP);

  // Centrado sobre el elemento, pero sin salirse por ningún borde.
  const cardLeft = Math.min(
    Math.max(GAP, hole.left + hole.width / 2 - CARD_WIDTH / 2),
    window.innerWidth - CARD_WIDTH - GAP
  );

  const isLast = index === visibleSteps.length - 1;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="spotlight"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100]"
        role="dialog"
        aria-modal="true"
        aria-label={step.title}
      >
        {/* El recorte no se dibuja con una máscara sino con una sombra enorme:
            un solo elemento, y el navegador la anima sin repintar el resto. */}
        <motion.div
          className="pointer-events-auto absolute rounded-xl ring-2 ring-primary/70"
          style={{ boxShadow: "0 0 0 9999px rgba(2, 6, 23, 0.72)" }}
          animate={{
            top: hole.top,
            left: hole.left,
            width: hole.width,
            height: hole.height,
          }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
          onClick={next}
        />

        <motion.div
          className="absolute w-80 rounded-xl border bg-popover p-4 shadow-xl"
          animate={{ top: cardTop, left: cardLeft }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
        >
          <div className="flex items-start justify-between gap-3">
            <span className="text-[11px] font-medium uppercase tracking-widest text-primary">
              {labels.counter(index + 1, visibleSteps.length)}
            </span>
            <button
              onClick={finish}
              aria-label={labels.skip}
              className="-mt-1 -mr-1 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <h3 className="mt-1.5 font-semibold">{step.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>

          <div className="mt-4 flex items-center gap-2">
            <div className="flex flex-1 items-center gap-1.5" aria-hidden>
              {visibleSteps.map((s, i) => (
                <span
                  key={s.target}
                  className={cn(
                    "h-1 rounded-full transition-all",
                    i === index ? "w-4 bg-primary" : "w-1 bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>

            {index > 0 && (
              <Button variant="ghost" size="sm" onClick={back}>
                {labels.back}
              </Button>
            )}
            <Button size="sm" onClick={next}>
              {isLast ? labels.finish : labels.next}
            </Button>
          </div>

          {index === 0 && (
            <button
              onClick={finish}
              className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {labels.skip}
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
