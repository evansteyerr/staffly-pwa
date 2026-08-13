import type { Fighter, Stance } from "@/types";
import { emptyRecord, computeOverall } from "@/types";
import { Rng } from "@/game/rng/prng";
import { baseAttributes, clamp, rollHiddenPotential, rollHiddenTraits } from "@/game/fighter/generate";
import type { RealFighterRecord } from "@/data/fighters/realRosterSchema";
import { resolveNationalityCode, resolveWeightClassId } from "@/data/fighters/realRosterSchema";

/**
 * Convertit une entree de roster reel valideee en Fighter jouable par le
 * moteur (section 5/122) : les champs factuels (nom, categorie,
 * nationalite, palmares, classement) viennent de l'entree fournie par
 * l'utilisateur ; les attributs de simulation detailles (striking,
 * cardio, potentiel cache...) sont generes par le moteur, calibres sur le
 * niveau reel indique (classement/palmares) mais jamais presentes comme
 * une donnee officielle — c'est le meme principe que pour tout NPC.
 */
function estimateQualityFromRanking(record: RealFighterRecord, rng: Rng): number {
  const { ranking } = record;
  if (ranking === "champion") return rng.int(90, 98);
  if (typeof ranking === "number") {
    if (ranking <= 3) return rng.int(84, 93);
    if (ranking <= 8) return rng.int(76, 87);
    return rng.int(68, 80);
  }
  // Non classe / classement inconnu : estimation prudente a partir du seul palmares connu.
  const total = record.record.wins + record.record.losses + record.record.draws;
  const winRate = total > 0 ? record.record.wins / total : 0.5;
  const base = 55 + winRate * 20 + Math.min(total, 15) * 0.5;
  return clamp(rng.gaussian(base, 5), 45, 82);
}

let importCounter = 0;

export function convertRealFighterRecord(record: RealFighterRecord, rng: Rng, worldDate: string): Fighter | null {
  const weightClassId = resolveWeightClassId(record.weightClass, record.gender);
  if (!weightClassId) {
    console.warn(`[realRoster] Categorie non reconnue pour ${record.firstName} ${record.lastName}: "${record.weightClass}" — entree ignoree.`);
    return null;
  }
  const nationalityCode = resolveNationalityCode(record.nationality);

  const quality = estimateQualityFromRanking(record, rng);
  const attributes = baseAttributes(rng, quality, 7);
  const overall = computeOverall(attributes);
  const hiddenPotential = rollHiddenPotential(rng, overall);
  const hiddenTraits = rollHiddenTraits(rng, rng.int(0, 2));

  const primeStart = hiddenTraits.includes("early_peak") ? 22 : hiddenTraits.includes("late_bloomer") ? 28 : 24;
  const primeEnd = hiddenTraits.includes("early_peak") ? 29 : hiddenTraits.includes("late_bloomer") ? 35 : 31;
  const declineRate = clamp(rng.gaussian(50, 15), 20, 90) / 100;

  // Age reel si connu (jamais invente) ; sinon une estimation plausible pour un roster pro (section 5 : null explicite, pas de fausse precision).
  const dateOfBirth = record.dateOfBirth ?? `${new Date(worldDate).getFullYear() - rng.int(24, 34)}-01-01`;
  const stances: Stance[] = ["orthodox", "southpaw", "switch"];

  importCounter += 1;
  const wins = record.record.wins;
  const losses = record.record.losses;

  return {
    id: `real-${record.firstName}-${record.lastName}-${importCounter}`.toLowerCase().replace(/\s+/g, "-"),
    firstName: record.firstName,
    lastName: record.lastName,
    nickname: record.nickname,
    gender: record.gender,
    nationality: nationalityCode,
    dateOfBirth,
    isPlayer: false,
    height: record.height ?? Math.round(rng.gaussian(178, 8)),
    reach: record.reach ?? Math.round(rng.gaussian(180, 9)),
    stance: rng.pick(stances),
    weightClass: weightClassId,
    organizationId: record.organizationId,
    record: {
      ...emptyRecord(),
      wins,
      losses,
      draws: record.record.draws,
      winsByKo: Math.round(wins * 0.35),
      winsBySub: Math.round(wins * 0.25),
      winsByDec: wins - Math.round(wins * 0.35) - Math.round(wins * 0.25),
    },
    attributes,
    form: clamp(rng.gaussian(70, 10), 40, 95),
    morale: clamp(rng.gaussian(65, 10), 40, 95),
    confidence: clamp(rng.gaussian(60, 10), 40, 95),
    reputation: clamp(quality - 5, 1, 95),
    popularity: clamp(rng.gaussian(quality, 10), 10, 95),
    momentum: 0,
    careerWear: clamp((wins + losses) * rng.float(0.5, 1.2), 0, 70),
    injuries: [],
    hiddenPotential,
    primeStart,
    primeEnd,
    declineRate,
    hiddenTraits,
    followers: Math.round(clamp(rng.gaussian(quality, 10), 10, 95) * 5000),
    source: "real",
    lastVerifiedAt: record.lastVerifiedAt,
    retired: false,
  };
}

export function convertRealRoster(records: RealFighterRecord[], seed: string, worldDate: string): Fighter[] {
  const rng = Rng.fromString(`real-roster:${seed}`);
  const fighters: Fighter[] = [];
  for (const record of records) {
    const fighter = convertRealFighterRecord(record, rng, worldDate);
    if (fighter) fighters.push(fighter);
  }
  return fighters;
}
