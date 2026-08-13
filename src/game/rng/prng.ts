/**
 * PRNG déterministe (mulberry32). Toute la logique du moteur qui a besoin
 * d'aléatoire doit passer par une instance de Rng — jamais Math.random()
 * directement — pour garantir: même seed + mêmes choix => même carrière
 * (section 84/130 du cahier des charges).
 */
export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  static fromString(seed: string): Rng {
    return new Rng(hashStringToInt(seed));
  }

  /** Récupère l'état interne pour sérialisation dans la sauvegarde. */
  getState(): number {
    return this.state;
  }

  static fromState(state: number): Rng {
    const rng = new Rng(0);
    rng.state = state >>> 0;
    return rng;
  }

  /** Flottant dans [0, 1). */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Entier dans [min, max] inclus. */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Flottant dans [min, max). */
  float(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /** true avec probabilité p (0-1). */
  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error("Rng.pick: liste vide");
    return items[this.int(0, items.length - 1)];
  }

  /** Tirage pondéré : items avec un champ weight > 0. */
  weightedPick<T>(items: readonly T[], weightOf: (item: T) => number): T {
    const weights = items.map(weightOf);
    const total = weights.reduce((a, b) => a + b, 0);
    if (total <= 0) throw new Error("Rng.weightedPick: poids total <= 0");
    let roll = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  /** Distribution normale approximée (Box-Muller), pour du bruit centré. */
  gaussian(mean: number, stdDev: number): number {
    const u1 = Math.max(this.next(), 1e-9);
    const u2 = this.next();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z0 * stdDev;
  }
}

function hashStringToInt(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  h ^= h >>> 16;
  return h >>> 0;
}
