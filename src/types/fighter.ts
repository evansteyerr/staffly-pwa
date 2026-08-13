import type { AttributeBlock } from "./attributes";

export type Gender = "male" | "female";
export type Stance = "orthodox" | "southpaw" | "switch";

export interface FightRecordSummary {
  wins: number;
  losses: number;
  draws: number;
  noContests: number;
  winsByKo: number;
  winsBySub: number;
  winsByDec: number;
}

export function emptyRecord(): FightRecordSummary {
  return { wins: 0, losses: 0, draws: 0, noContests: 0, winsByKo: 0, winsBySub: 0, winsByDec: 0 };
}

/** Traits cachés (section 14) — peuvent influencer le moteur sans être toujours révélés au joueur. */
export type HiddenTrait =
  | "iron_chin"
  | "glass_chin"
  | "cardio_freak"
  | "natural_power"
  | "slow_learner"
  | "fast_learner"
  | "injury_prone"
  | "clutch_performer"
  | "pressure_fighter"
  | "bad_weight_cutter"
  | "media_natural"
  | "late_bloomer"
  | "early_peak"
  | "gym_rat"
  | "big_fight_player"
  | "mentally_fragile"
  | "comeback_king"
  | "submission_magnet"
  | "cold_blooded"
  | "warrior"
  | "technical_genius";

export interface Fighter {
  id: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  gender: Gender;
  nationality: string;
  dateOfBirth: string; // ISO date
  isPlayer: boolean;

  height: number; // cm
  reach: number; // cm
  stance: Stance;
  weightClass: string; // weightClassId

  organizationId: string | null;
  record: FightRecordSummary;

  attributes: AttributeBlock;

  // Stats courantes (section 17), 0-100
  form: number;
  morale: number;
  confidence: number;
  reputation: number;
  popularity: number;

  momentum: number; // -100..100
  careerWear: number; // 0-100, usure cumulative
  injuries: FighterInjury[];

  hiddenPotential: number; // plafond souple, jamais montré tel quel
  primeStart: number;
  primeEnd: number;
  declineRate: number; // 0-1, vitesse du déclin post-prime
  hiddenTraits: HiddenTrait[];

  followers: number;

  source: "real" | "generated" | "player";
  lastVerifiedAt?: string;

  retired: boolean;
}

export type InjurySeverity = "minor" | "moderate" | "major" | "career_threatening";

export interface FighterInjury {
  id: string;
  bodyPart: string;
  severity: InjurySeverity;
  incurredOn: string; // ISO date
  healsOn: string; // ISO date
}
