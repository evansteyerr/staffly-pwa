import type { AttributeBlock, Fighter } from "@/types";
import { ATTRIBUTE_KEYS, computeOverall } from "@/types";
import { Rng } from "@/game/rng/prng";

/**
 * Courbe non lineaire (section 37/G) : progression rapide 18-23, prime
 * 24-29 (proche du plafond), plateau variable 30-33, declin potentiel
 * 34+. Les traits caches (late_bloomer/early_peak/fast_learner/...)
 * decalent ou accelerent cette courbe (deja reflete dans primeStart/End).
 */
export function progressionRateForAge(fighter: Fighter, age: number): number {
  if (age < fighter.primeStart) {
    const yearsUntilPrime = Math.max(1, fighter.primeStart - age);
    return 1.4 / yearsUntilPrime + 0.6;
  }
  if (age <= fighter.primeEnd) return 0.3;
  return -fighter.declineRate * 0.6;
}

function clamp(n: number, min = 1, max = 99): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function applyAgingTick(fighter: Fighter, age: number, days: number, rng: Rng): Fighter {
  const monthsFraction = days / 30;
  const rate = progressionRateForAge(fighter, age);
  const learnerMod = fighter.hiddenTraits.includes("fast_learner") ? 1.3 : fighter.hiddenTraits.includes("slow_learner") ? 0.7 : 1;

  const attributes: AttributeBlock = { ...fighter.attributes };
  for (const key of ATTRIBUTE_KEYS) {
    const towardPotential = rate > 0 ? (fighter.hiddenPotential - attributes[key]) * 0.02 : 0;
    const decline = rate < 0 ? rate * 0.5 : 0;
    const noise = rng.gaussian(0, 0.4);
    attributes[key] = clamp(attributes[key] + (towardPotential * rate * learnerMod + decline) * monthsFraction + noise * monthsFraction);
  }

  const wearIncrease = Math.max(0, rate < 0 ? 0.12 : 0.02) * monthsFraction;

  return {
    ...fighter,
    attributes,
    careerWear: Math.min(100, fighter.careerWear + wearIncrease),
  };
}

export { computeOverall };
