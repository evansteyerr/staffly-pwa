export interface AttributeBlock {
  // Striking
  striking: number;
  boxing: number;
  kickboxing: number;
  kicks: number;
  power: number;
  speed: number;
  accuracy: number;
  strikingDefense: number;
  // Grappling
  wrestling: number;
  takedownOffense: number;
  takedownDefense: number;
  bjj: number;
  submissionOffense: number;
  submissionDefense: number;
  groundControl: number;
  groundAndPound: number;
  // Physique
  cardio: number;
  strength: number;
  explosiveness: number;
  chin: number;
  durability: number;
  recovery: number;
  // Mental
  fightIQ: number;
  composure: number;
  aggression: number;
  discipline: number;
}

export const ATTRIBUTE_KEYS = [
  "striking",
  "boxing",
  "kickboxing",
  "kicks",
  "power",
  "speed",
  "accuracy",
  "strikingDefense",
  "wrestling",
  "takedownOffense",
  "takedownDefense",
  "bjj",
  "submissionOffense",
  "submissionDefense",
  "groundControl",
  "groundAndPound",
  "cardio",
  "strength",
  "explosiveness",
  "chin",
  "durability",
  "recovery",
  "fightIQ",
  "composure",
  "aggression",
  "discipline",
] as const satisfies readonly (keyof AttributeBlock)[];

export type AttributeKey = (typeof ATTRIBUTE_KEYS)[number];

/** Poids utilisés pour dériver l'Overall visible à partir du détail. */
export const OVERALL_WEIGHTS: Record<AttributeKey, number> = {
  striking: 1.2,
  boxing: 0.5,
  kickboxing: 0.5,
  kicks: 0.5,
  power: 1,
  speed: 0.8,
  accuracy: 0.8,
  strikingDefense: 0.9,
  wrestling: 1,
  takedownOffense: 0.7,
  takedownDefense: 0.8,
  bjj: 0.8,
  submissionOffense: 0.6,
  submissionDefense: 0.7,
  groundControl: 0.7,
  groundAndPound: 0.5,
  cardio: 1,
  strength: 0.6,
  explosiveness: 0.6,
  chin: 0.9,
  durability: 0.6,
  recovery: 0.4,
  fightIQ: 1,
  composure: 0.6,
  aggression: 0.3,
  discipline: 0.4,
};

export function computeOverall(attributes: AttributeBlock): number {
  let sum = 0;
  let weightSum = 0;
  for (const key of ATTRIBUTE_KEYS) {
    const weight = OVERALL_WEIGHTS[key];
    sum += attributes[key] * weight;
    weightSum += weight;
  }
  return Math.round(sum / weightSum);
}

/** Regroupement simplifié affiché sur la fiche principale (section 16). */
export interface SimplifiedRatings {
  striking: number;
  grappling: number;
  physical: number;
  mental: number;
  overall: number;
}

export function computeSimplifiedRatings(attributes: AttributeBlock): SimplifiedRatings {
  const striking = avg(attributes, ["striking", "boxing", "kickboxing", "kicks", "power", "accuracy", "strikingDefense", "speed"]);
  const grappling = avg(attributes, ["wrestling", "takedownOffense", "takedownDefense", "bjj", "submissionOffense", "submissionDefense", "groundControl", "groundAndPound"]);
  const physical = avg(attributes, ["cardio", "strength", "explosiveness", "chin", "durability", "recovery"]);
  const mental = avg(attributes, ["fightIQ", "composure", "aggression", "discipline"]);
  return { striking, grappling, physical, mental, overall: computeOverall(attributes) };
}

function avg(attributes: AttributeBlock, keys: AttributeKey[]): number {
  const total = keys.reduce((acc, k) => acc + attributes[k], 0);
  return Math.round(total / keys.length);
}
