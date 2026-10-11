"use client";

import { useEffect } from "react";
import {
  bezelFor,
  displacementScale,
  fillLensMap,
  type LensGeometry,
} from "@/lib/liquidGlass";

// Elementos de cristal que reciben refracción. Cada uno obtiene un filtro SVG a
// su medida (tamaño y radio), porque la banda del borde debe medir lo mismo en px
// en el sidebar que en un menú. Los paneles, las tarjetas y los botones no la
// llevan: solo desenfocan. Los filtros SVG sobre backdrop-filter se renderizan
// por software en Chromium; con decenas de botones en pantalla la página se
// ralentiza, así que la lente se reserva a unas pocas superficies grandes.
const LENS_SELECTOR = [
  '[data-slot="sidebar-inner"]',
  ".workspace-navbar",
  '[data-slot="dialog-content"]',
  '[data-slot="popover-content"]',
  '[data-slot="dropdown-menu-content"]',
  '[data-slot="select-content"]',
].join(",");

const SVG_NS = "http://www.w3.org/2000/svg";
const QUANTUM = 8; // los tamaños se agrupan de 8 en 8 px para reutilizar filtros
const MAX_MAP_SIDE = 360; // el mapa va a menor resolución y se amplía suavemente

function quantize(n: number) {
  return Math.max(QUANTUM, Math.round(n / QUANTUM) * QUANTUM);
}

function buildMapUrl(g: LensGeometry): string {
  const k = Math.min(1, MAX_MAP_SIDE / Math.max(g.w, g.h));
  const mw = Math.max(2, Math.round(g.w * k));
  const mh = Math.max(2, Math.round(g.h * k));
  const canvas = document.createElement("canvas");
  canvas.width = mw;
  canvas.height = mh;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const image = ctx.createImageData(mw, mh);
  fillLensMap(image.data, mw, mh, g);
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}

/**
 * Observa los elementos de cristal y les asigna --kiki-lens: url(#filtro) con la
 * medida exacta. El CSS lo usa como `backdrop-filter: var(--kiki-lens,) blur(…)`;
 * sin la variable queda solo el desenfoque (Safari, Firefox).
 */
export function LiquidGlassEngine() {
  useEffect(() => {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.style.position = "absolute";
    const defs = document.createElementNS(SVG_NS, "defs");
    svg.appendChild(defs);
    document.body.appendChild(svg);

    // id -> promesa del filtro ya creado (o en creación). Se espera a que el mapa
    // esté decodificado antes de usarlo: si no, durante unos milisegundos el filtro
    // devuelve blanco y el elemento parpadea.
    const filters = new Map<string, Promise<string | null>>();
    const seen = new WeakSet<Element>();
    let disposed = false;

    const createFilter = async (id: string, w: number, h: number, radius: number) => {
      const bezel = bezelFor(w, h);
      const url = buildMapUrl({ w, h, radius, bezel });
      if (!url) return null;
      try {
        const probe = new Image();
        probe.src = url;
        await probe.decode();
      } catch {
        return null;
      }
      if (disposed) return null;

      const filter = document.createElementNS(SVG_NS, "filter");
      filter.setAttribute("id", id);
      filter.setAttribute("filterUnits", "userSpaceOnUse");
      filter.setAttribute("x", "0");
      filter.setAttribute("y", "0");
      filter.setAttribute("width", String(w));
      filter.setAttribute("height", String(h));
      filter.setAttribute("color-interpolation-filters", "sRGB");

      const image = document.createElementNS(SVG_NS, "feImage");
      image.setAttribute("href", url);
      image.setAttribute("x", "0");
      image.setAttribute("y", "0");
      image.setAttribute("width", String(w));
      image.setAttribute("height", String(h));
      image.setAttribute("preserveAspectRatio", "none");
      image.setAttribute("result", "map");

      const displace = document.createElementNS(SVG_NS, "feDisplacementMap");
      displace.setAttribute("in", "SourceGraphic");
      displace.setAttribute("in2", "map");
      displace.setAttribute("scale", String(displacementScale(bezel)));
      displace.setAttribute("xChannelSelector", "R");
      displace.setAttribute("yChannelSelector", "G");

      filter.append(image, displace);
      defs.appendChild(filter);
      return id;
    };

    const ensureFilter = (w: number, h: number, radius: number) => {
      const id = `kiki-lens-${w}x${h}r${radius}`;
      let pending = filters.get(id);
      if (!pending) {
        pending = createFilter(id, w, h, radius);
        filters.set(id, pending);
      }
      return pending;
    };

    const apply = async (el: HTMLElement) => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (!w || !h) return;
      const radius = Math.min(
        parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0,
        Math.min(w, h) / 2,
      );
      const id = await ensureFilter(quantize(w), quantize(h), Math.round(radius));
      if (id && !disposed) el.style.setProperty("--kiki-lens", `url(#${id})`);
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) void apply(entry.target as HTMLElement);
    });

    const attach = (el: Element) => {
      if (seen.has(el)) return;
      seen.add(el);
      resizeObserver.observe(el);
      void apply(el as HTMLElement);
    };

    const scan = (root: Element | Document) => {
      if (root instanceof Element && root.matches(LENS_SELECTOR)) attach(root);
      root.querySelectorAll(LENS_SELECTOR).forEach(attach);
    };

    scan(document);
    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) scan(node as Element);
        });
      }
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      svg.remove();
      document
        .querySelectorAll<HTMLElement>("[style*='--kiki-lens']")
        .forEach((el) => el.style.removeProperty("--kiki-lens"));
    };
  }, []);

  return null;
}
