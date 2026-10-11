// Matemática de la lente del estilo Glass.
//
// Liquid Glass no es un desenfoque: el borde del cristal es una lente convexa que
// curva la luz. En web se aproxima con feDisplacementMap: un mapa donde el canal
// R/G codifica hacia dónde mirar (128 = sin desplazamiento). Para que el borde se
// vea como cristal y no como una banda borrosa, el mapa debe:
//   - ajustarse al tamaño y al radio de cada elemento (la banda del borde mide lo
//     mismo en px en un botón que en un sidebar),
//   - ser fuerte solo en el bisel y cero en el centro,
//   - apuntar hacia dentro (una lente convexa converge los rayos y magnifica).
//
// El perfil del bisel es un "squircle" convexo, h(t) = (1 - (1 - t)^4)^(1/4), con
// t = distancia al borde / ancho del bisel. El desplazamiento sigue la pendiente
// de esa superficie: muy fuerte en el borde, nula hacia el interior.

export type LensGeometry = {
  w: number;
  h: number;
  /** Radio de las esquinas, en px. */
  radius: number;
  /** Ancho de la banda del borde donde actúa la lente, en px. */
  bezel: number;
};

// Cuánto de la pendiente se traduce en desplazamiento (satura en 1 junto al borde).
const SLOPE_GAIN = 0.55;

/**
 * Distancia hacia dentro del borde (negativa fuera) y normal interior unitaria
 * en el punto (x, y), con origen en la esquina superior izquierda.
 */
export function edgeInfo(x: number, y: number, g: Pick<LensGeometry, "w" | "h" | "radius">) {
  const hx = g.w / 2;
  const hy = g.h / 2;
  const r = Math.max(0, Math.min(g.radius, hx, hy));
  const px = x - hx;
  const py = y - hy;
  const qx = Math.abs(px) - (hx - r);
  const qy = Math.abs(py) - (hy - r);

  // Distancia con signo a un rectángulo redondeado (negativa dentro).
  const sdf =
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;

  // Normal exterior.
  let nx: number;
  let ny: number;
  if (qx > 0 && qy > 0) {
    const len = Math.hypot(qx, qy) || 1;
    nx = (qx / len) * Math.sign(px);
    ny = (qy / len) * Math.sign(py);
  } else if (qx > qy) {
    nx = Math.sign(px) || 1;
    ny = 0;
  } else {
    nx = 0;
    ny = Math.sign(py) || 1;
  }

  // 0 - n evita el cero negativo (-0) cuando la normal no tiene componente en un eje.
  return { depth: -sdf, inwardX: 0 - nx, inwardY: 0 - ny };
}

/** Magnitud 0..1 de la refracción a una fracción t (0 = borde, 1 = fin del bisel). */
export function bezelMagnitude(t: number): number {
  if (t <= 0) return 1;
  if (t >= 1) return 0;
  const u = 1 - t;
  const inner = 1 - u ** 4;
  const slope = inner ** -0.75 * u ** 3;
  return Math.min(1, slope * SLOPE_GAIN);
}

/** Desplazamiento (-1..1 por eje) que la lente aplica en el punto (x, y). */
export function lensVector(x: number, y: number, g: LensGeometry): [number, number] {
  const { depth, inwardX, inwardY } = edgeInfo(x, y, g);
  if (depth < 0 || depth >= g.bezel) return [0, 0];
  const m = bezelMagnitude(depth / g.bezel);
  return [inwardX * m, inwardY * m];
}

/** Rellena un buffer RGBA con el mapa de desplazamiento (neutro = 128). */
export function fillLensMap(data: Uint8ClampedArray, mw: number, mh: number, g: LensGeometry) {
  // El mapa puede ir a menor resolución que el elemento: se escala la geometría.
  const sx = mw / g.w;
  const sy = mh / g.h;
  const scaled: LensGeometry = {
    w: mw,
    h: mh,
    radius: g.radius * Math.min(sx, sy),
    bezel: g.bezel * Math.min(sx, sy),
  };
  for (let y = 0; y < mh; y++) {
    for (let x = 0; x < mw; x++) {
      const [vx, vy] = lensVector(x + 0.5, y + 0.5, scaled);
      const i = (y * mw + x) * 4;
      data[i] = 128 + Math.round(127 * vx);
      data[i + 1] = 128 + Math.round(127 * vy);
      data[i + 2] = 128;
      data[i + 3] = 255;
    }
  }
}

/** Ancho del bisel para un elemento: constante en px, acotado por su tamaño. */
export function bezelFor(w: number, h: number): number {
  return Math.max(6, Math.min(22, Math.min(w, h) * 0.4));
}

/** Escala de feDisplacementMap: el doble del desplazamiento máximo en px. */
export function displacementScale(bezel: number): number {
  return Math.round(bezel * 0.85 * 2);
}
