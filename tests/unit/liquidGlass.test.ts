import { describe, it, expect } from "vitest";
import {
  bezelFor,
  bezelMagnitude,
  displacementScale,
  edgeInfo,
  fillLensMap,
  lensVector,
} from "@/lib/liquidGlass";

const g = { w: 200, h: 100, radius: 20, bezel: 16 };

describe("bezelMagnitude", () => {
  it("es máxima en el borde y nula al final del bisel", () => {
    expect(bezelMagnitude(0)).toBe(1);
    expect(bezelMagnitude(1)).toBe(0);
  });

  it("decrece de forma monótona hacia el interior", () => {
    let prev = bezelMagnitude(0.02);
    for (let t = 0.1; t < 1; t += 0.1) {
      const m = bezelMagnitude(t);
      expect(m).toBeLessThanOrEqual(prev);
      prev = m;
    }
  });

  it("queda acotada entre 0 y 1", () => {
    for (let t = -0.5; t <= 1.5; t += 0.05) {
      const m = bezelMagnitude(t);
      expect(m).toBeGreaterThanOrEqual(0);
      expect(m).toBeLessThanOrEqual(1);
    }
  });
});

describe("edgeInfo", () => {
  it("mide la distancia hacia dentro en los lados rectos", () => {
    expect(edgeInfo(5, 50, g).depth).toBeCloseTo(5);
    expect(edgeInfo(100, 4, g).depth).toBeCloseTo(4);
  });

  it("la normal interior apunta hacia el centro", () => {
    const left = edgeInfo(3, 50, g);
    expect([left.inwardX, left.inwardY]).toEqual([1, 0]);
    const right = edgeInfo(197, 50, g);
    expect([right.inwardX, right.inwardY]).toEqual([-1, 0]);
    const top = edgeInfo(100, 3, g);
    expect([top.inwardX, top.inwardY]).toEqual([0, 1]);
  });

  it("respeta el radio de las esquinas", () => {
    // Con radio 20, el punto (2,2) queda fuera del arco: profundidad negativa.
    expect(edgeInfo(2, 2, g).depth).toBeLessThan(0);
    // En la diagonal del arco, la profundidad es menor que en un lado recto.
    expect(edgeInfo(8, 8, g).depth).toBeLessThan(8);
  });
});

describe("lensVector", () => {
  it("no desplaza el centro ni lo que queda más allá del bisel", () => {
    expect(lensVector(100, 50, g)).toEqual([0, 0]);
    expect(lensVector(g.bezel + 1, 50, g)).toEqual([0, 0]);
  });

  it("empuja hacia dentro junto al borde", () => {
    const [vx, vy] = lensVector(2, 50, g);
    expect(vx).toBeGreaterThan(0.5);
    expect(vy).toBeCloseTo(0);
    const [rx] = lensVector(198, 50, g);
    expect(rx).toBeLessThan(-0.5);
  });
});

describe("fillLensMap", () => {
  it("deja el centro neutro (128) y el borde fuera de 128", () => {
    const mw = 100;
    const mh = 50;
    const data = new Uint8ClampedArray(mw * mh * 4);
    fillLensMap(data, mw, mh, { w: mw, h: mh, radius: 10, bezel: 10 });
    const at = (x: number, y: number) => {
      const i = (y * mw + x) * 4;
      return [data[i], data[i + 1], data[i + 2], data[i + 3]];
    };
    expect(at(50, 25)).toEqual([128, 128, 128, 255]);
    expect(at(1, 25)[0]).toBeGreaterThan(128);
    expect(at(98, 25)[0]).toBeLessThan(128);
  });

  it("escala la geometría cuando el mapa va a menor resolución", () => {
    const data = new Uint8ClampedArray(50 * 25 * 4);
    fillLensMap(data, 50, 25, { w: 100, h: 50, radius: 10, bezel: 10 });
    // El bisel (10 px) pasa a 5 px: el píxel 10 ya es neutro.
    expect(data[(12 * 50 + 10) * 4]).toBe(128);
    expect(data[(12 * 50 + 1) * 4]).toBeGreaterThan(128);
  });
});

describe("bezelFor y displacementScale", () => {
  it("acota el bisel entre 6 y 22 px", () => {
    expect(bezelFor(30, 14)).toBe(6);
    expect(bezelFor(900, 900)).toBe(22);
    expect(bezelFor(100, 40)).toBeCloseTo(16);
  });

  it("la escala del desplazamiento crece con el bisel", () => {
    expect(displacementScale(22)).toBeGreaterThan(displacementScale(10));
  });
});
