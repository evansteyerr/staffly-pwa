import type { AttributeBlock, AttributeKey, Fighter, Gender, HiddenTrait, Stance } from "@/types";
import { ATTRIBUTE_KEYS, computeOverall, emptyRecord } from "@/types";
import { Rng } from "@/game/rng/prng";
import { getStyle } from "@/data/creation/styles";
import { getOrigin } from "@/data/creation/origins";
import { HIDDEN_TRAITS } from "@/data/creation/hiddenTraits";
import { getNationality } from "@/data/names";
import type { StyleId, OriginId } from "@/types";

const CONTRADICTING_TRAITS: Partial<Record<HiddenTrait, HiddenTrait[]>> = {
  iron_chin: ["glass_chin"],
  glass_chin: ["iron_chin"],
  slow_learner: ["fast_learner"],
  fast_learner: ["slow_learner"],
  late_bloomer: ["early_peak"],
  early_peak: ["late_bloomer"],
};

function clamp(n: number, min = 1, max = 99): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function baseAttributes(rng: Rng, center: number, spread: number): AttributeBlock {
  const block = {} as AttributeBlock;
  for (const key of ATTRIBUTE_KEYS) {
    block[key] = clamp(rng.gaussian(center, spread));
  }
  return block;
}

export function rollHiddenTraits(rng: Rng, count = 2): HiddenTrait[] {
  const pool = [...HIDDEN_TRAITS];
  const chosen: HiddenTrait[] = [];
  while (chosen.length < count && pool.length > 0) {
    const pick = rng.weightedPick(pool, (t) => t.rarity);
    const forbidden = chosen.flatMap((c) => CONTRADICTING_TRAITS[c] ?? []);
    if (!forbidden.includes(pick.id)) {
      chosen.push(pick.id);
    }
    const idx = pool.findIndex((t) => t.id === pick.id);
    pool.splice(idx, 1);
  }
  return chosen;
}

export function rollHiddenPotential(rng: Rng, currentOverall: number): number {
  // Le potentiel peut etre proche du niveau actuel (peu de marge) ou tres
  // eloigne (grand espoir) — distribution volontairement large (section 15).
  const margin = rng.gaussian(18, 12);
  return clamp(currentOverall + Math.max(2, margin), currentOverall, 99);
}

export interface PlayerCreationInput {
  firstName: string;
  lastName: string;
  gender: Gender;
  nationalityCode: string;
  weightClassId: string;
  styleId: StyleId;
  originId: OriginId;
  dateOfBirth: string;
}

export function generatePlayerFighter(input: PlayerCreationInput, rng: Rng): Fighter {
  const style = getStyle(input.styleId);
  const origin = getOrigin(input.originId);

  let attributes = baseAttributes(rng, 42, 6);
  attributes = applyModifiers(attributes, style.bonuses);
  attributes = applyModifiers(attributes, style.maluses);
  attributes = applyModifiers(attributes, origin.bonuses);
  attributes = applyModifiers(attributes, origin.maluses);

  const overall = computeOverall(attributes);
  const hiddenPotential = rollHiddenPotential(rng, overall);
  const hiddenTraits = rollHiddenTraits(rng, rng.int(1, 3));

  const primeStart = hiddenTraits.includes("early_peak") ? 22 : hiddenTraits.includes("late_bloomer") ? 28 : 24;
  const primeEnd = hiddenTraits.includes("early_peak") ? 29 : hiddenTraits.includes("late_bloomer") ? 35 : 31;
  const declineRate = clamp(rng.gaussian(50, 15), 20, 90) / 100;

  const stances: Stance[] = ["orthodox", "southpaw", "switch"];

  return {
    id: `player-${rng.int(0, 2_147_483_647).toString(36)}`,
    firstName: input.firstName,
    lastName: input.lastName,
    gender: input.gender,
    nationality: input.nationalityCode,
    dateOfBirth: input.dateOfBirth,
    isPlayer: true,
    height: Math.round(rng.gaussian(178, 8)),
    reach: Math.round(rng.gaussian(180, 9)),
    stance: rng.pick(stances),
    weightClass: input.weightClassId,
    organizationId: null,
    record: emptyRecord(),
    attributes,
    form: 70,
    morale: 65,
    confidence: 55,
    reputation: 5,
    popularity: origin.startingPopularity,
    momentum: 0,
    careerWear: 0,
    injuries: [],
    hiddenPotential,
    primeStart,
    primeEnd,
    declineRate,
    hiddenTraits,
    followers: Math.round(200 + origin.startingPopularity * 150),
    source: "player",
    retired: false,
  };
}

export interface NpcGenerationInput {
  nationalityCode: string;
  gender: Gender;
  weightClassId: string;
  quality: number; // 0-100, centre approximatif de l'overall vise
  age: number;
  worldDate: string;
  organizationId: string | null;
}

export function generateNpcFighter(input: NpcGenerationInput, rng: Rng): Fighter {
  const nat = getNationality(input.nationalityCode);
  const firstName = rng.pick(input.gender === "male" ? nat.male : nat.female);
  const lastName = rng.pick(nat.surnames);

  const attributes = baseAttributes(rng, input.quality, 8);
  const overall = computeOverall(attributes);
  const hiddenPotential = rollHiddenPotential(rng, overall);
  const hiddenTraits = rollHiddenTraits(rng, rng.int(0, 2));

  const primeStart = hiddenTraits.includes("early_peak") ? 22 : hiddenTraits.includes("late_bloomer") ? 28 : 24;
  const primeEnd = hiddenTraits.includes("early_peak") ? 29 : hiddenTraits.includes("late_bloomer") ? 35 : 31;
  const declineRate = clamp(rng.gaussian(50, 15), 20, 90) / 100;

  const birthYear = new Date(input.worldDate).getFullYear() - input.age;
  const stances: Stance[] = ["orthodox", "southpaw", "switch"];

  const winRate = clamp(rng.gaussian(input.quality, 10), 20, 95) / 100;
  const fights = Math.max(0, Math.round(input.age - 18) * rng.int(1, 3));
  const wins = Math.round(fights * winRate);
  const losses = fights - wins;

  // Identifiant derive uniquement du PRNG de la carriere (deterministe, pas de compteur module-level).
  const uniqueSuffix = rng.int(0, 2_147_483_647).toString(36);

  return {
    id: `npc-${birthYear}-${firstName}-${lastName}-${uniqueSuffix}`.toLowerCase().replace(/\s+/g, "-"),
    firstName,
    lastName,
    gender: input.gender,
    nationality: input.nationalityCode,
    dateOfBirth: `${birthYear}-01-01`,
    isPlayer: false,
    height: Math.round(rng.gaussian(178, 8)),
    reach: Math.round(rng.gaussian(180, 9)),
    stance: rng.pick(stances),
    weightClass: input.weightClassId,
    organizationId: input.organizationId,
    record: { ...emptyRecord(), wins, losses, winsByKo: Math.round(wins * 0.35), winsBySub: Math.round(wins * 0.25), winsByDec: wins - Math.round(wins * 0.35) - Math.round(wins * 0.25) },
    attributes,
    form: clamp(rng.gaussian(65, 15), 20, 95),
    morale: clamp(rng.gaussian(60, 15), 20, 95),
    confidence: clamp(rng.gaussian(55, 15), 20, 95),
    reputation: clamp(input.quality - 10, 1, 95),
    popularity: clamp(rng.gaussian(input.quality - 15, 15), 1, 95),
    momentum: 0,
    careerWear: clamp(fights * rng.float(0.5, 1.5), 0, 80),
    injuries: [],
    hiddenPotential,
    primeStart,
    primeEnd,
    declineRate,
    hiddenTraits,
    followers: Math.round(clamp(rng.gaussian(input.quality - 15, 15), 1, 95) * 3000),
    source: "generated",
    retired: false,
  };
}

function applyModifiers(attributes: AttributeBlock, mods: Partial<AttributeBlock>): AttributeBlock {
  const result = { ...attributes };
  for (const key of Object.keys(mods) as AttributeKey[]) {
    result[key] = clamp(result[key] + (mods[key] ?? 0));
  }
  return result;
}

export function ageFromDob(dateOfBirth: string, atDate: string): number {
  const dob = new Date(dateOfBirth);
  const at = new Date(atDate);
  let age = at.getFullYear() - dob.getFullYear();
  const m = at.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && at.getDate() < dob.getDate())) age--;
  return age;
}
