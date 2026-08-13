import type { CareerState } from "@/types";

/** Ponderation isolee (section I/74) pour rester facile a requilibrer apres simulation de masse. */
export const LEGACY_WEIGHTS = {
  proWin: 5,
  finish: 3,
  rankedWin: 15,
  top5Win: 30,
  winOverFormerChampion: 35,
  majorTitle: 150,
  titleDefense: 75,
  doubleChamp: 200,
  fightOfTheNight: 15,
  performanceOfTheNight: 10,
  popularityPeak: 0.4,
  longevityPerFight: 2,
} as const;

export interface LegacyBreakdown {
  total: number;
  fromWins: number;
  fromFinishes: number;
  fromTitles: number;
  fromAwards: number;
  fromLongevity: number;
  fromPopularity: number;
}

export function computeLegacy(state: CareerState): LegacyBreakdown {
  const { fighter, fightHistory, titles, awards } = state;

  const wins = fightHistory.filter((f) => f.result === "win");
  const finishes = wins.filter((f) => f.fight.method === "ko" || f.fight.method === "tko" || f.fight.method === "submission");

  const fromWins = wins.length * LEGACY_WEIGHTS.proWin + wins.filter((f) => f.fight.fightImportanceScore >= 55).length * LEGACY_WEIGHTS.rankedWin;
  const fromFinishes = finishes.length * LEGACY_WEIGHTS.finish;

  const majorTitles = titles.length;
  const totalDefenses = titles.reduce((sum, t) => sum + t.defenses, 0);
  const isDoubleChamp = new Set(titles.map((t) => t.titleId.split("-")[1])).size >= 2 && majorTitles >= 2;

  const fromTitles =
    majorTitles * LEGACY_WEIGHTS.majorTitle +
    totalDefenses * LEGACY_WEIGHTS.titleDefense +
    (isDoubleChamp ? LEGACY_WEIGHTS.doubleChamp : 0);

  const fromAwards = awards.reduce((sum, a) => {
    if (a === "fight_of_the_night") return sum + LEGACY_WEIGHTS.fightOfTheNight;
    if (a === "performance_of_the_night") return sum + LEGACY_WEIGHTS.performanceOfTheNight;
    return sum;
  }, 0);

  const fromLongevity = fightHistory.length * LEGACY_WEIGHTS.longevityPerFight;
  const fromPopularity = fighter.popularity * LEGACY_WEIGHTS.popularityPeak;

  const total = Math.round(fromWins + fromFinishes + fromTitles + fromAwards + fromLongevity + fromPopularity);

  return { total, fromWins, fromFinishes, fromTitles, fromAwards, fromLongevity, fromPopularity };
}

export interface LegacyClassInfo {
  id: string;
  label: string;
  min: number;
  max: number;
}

export const LEGACY_CLASSES: LegacyClassInfo[] = [
  { id: "journeyman", label: "Journeyman", min: 0, max: 150 },
  { id: "regional_fighter", label: "Combattant regional", min: 150, max: 300 },
  { id: "recognized_pro", label: "Pro reconnu", min: 300, max: 500 },
  { id: "contender", label: "Contender", min: 500, max: 750 },
  { id: "elite_fighter", label: "Combattant elite", min: 750, max: 1000 },
  { id: "champion", label: "Champion", min: 1000, max: 1400 },
  { id: "superstar", label: "Superstar", min: 1400, max: 1800 },
  { id: "legend", label: "Legende", min: 1800, max: 2200 },
  { id: "goat_territory", label: "Territoire du GOAT", min: 2200, max: Infinity },
];

export function classifyLegacy(total: number): LegacyClassInfo {
  return LEGACY_CLASSES.find((c) => total >= c.min && total < c.max) ?? LEGACY_CLASSES[0];
}
