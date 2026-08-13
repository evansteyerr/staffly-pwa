import { describe, expect, it } from "vitest";
import { Rng } from "./prng";

describe("Rng", () => {
  it("est deterministe pour une meme seed", () => {
    const a = Rng.fromString("seed-123");
    const b = Rng.fromString("seed-123");
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it("produit des sequences differentes pour des seeds differentes", () => {
    const a = Rng.fromString("seed-1");
    const b = Rng.fromString("seed-2");
    expect(a.next()).not.toEqual(b.next());
  });

  it("peut reprendre depuis un etat serialise", () => {
    const a = Rng.fromString("seed-resume");
    a.next();
    a.next();
    const state = a.getState();
    const expected = a.next();

    const b = Rng.fromState(state);
    expect(b.next()).toEqual(expected);
  });

  it("reste dans les bornes pour int/float/chance", () => {
    const rng = Rng.fromString("bounds");
    for (let i = 0; i < 200; i++) {
      const v = rng.int(3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
      const f = rng.float(1, 2);
      expect(f).toBeGreaterThanOrEqual(1);
      expect(f).toBeLessThan(2);
    }
  });
});
