import type { Fighter } from "./fighter";
import type { Contract } from "./contract";
import type { ActiveEvent, CareerMoment, ScheduledEvent } from "./events";
import type { FightRecord } from "./fight";
import type { TitleReign } from "./organization";
import type { WorldState } from "./world";

export interface NarrativeVariables {
  hunger: number;
  ego: number;
  stress: number;
  mediaPressure: number;
  coachTrust: number;
  promoterTrust: number;
  financialSecurity: number;
}

export interface Finances {
  careerEarnings: number;
  netWorth: number;
}

export type StyleId = "boxer" | "wrestler" | "bjj" | "muay_thai" | "judo" | "sambo" | "modern_mma";
export type OriginId =
  | "wrestling_prodigy"
  | "boxing_family"
  | "hard_neighborhood"
  | "strict_family"
  | "wealthy_family"
  | "social_media_star"
  | "former_athlete"
  | "late_bloomer";
export type LifestyleId = "ascetic" | "balanced" | "party" | "businessman";
export type EntourageId = "family" | "ambitious_manager" | "childhood_friend" | "super_agent" | "crew";

export interface CareerCreationChoices {
  styleId: StyleId;
  originId: OriginId;
  lifestyleId: LifestyleId;
  entourageId: EntourageId;
}

export interface CareerState {
  careerId: string;
  seed: string;
  databaseVersion: string;
  worldDate: string;

  fighter: Fighter;
  creationChoices: CareerCreationChoices;

  contract: Contract | null;
  pendingOffers: import("./contract").ContractOffer[];

  relationships: Record<string, number>; // coach/manager/gym/promoter -100..100
  fighterRelationships: Record<string, number>; // fighterId -> -100..100 (rivaux, amis)

  flags: string[];
  activeEvent: ActiveEvent | null;
  pendingFollowUps: ScheduledEvent[];
  eventHistory: Record<string, { lastFiredOn: string; count: number }>;

  fightHistory: FightRecord[];
  careerHistory: CareerMoment[];
  titles: TitleReign[];
  awards: string[];

  finances: Finances;
  narrative: NarrativeVariables;

  worldState: WorldState;
  rngState: number;

  retired: boolean;
  retiredOn?: string;
  legacyScore?: number;
  legacyClass?: string;
  epilogue?: string;

  pendingFight?: {
    opponentId: string;
    organizationId: string;
    eventName: string;
    isTitleFight: boolean;
    scheduledOn: string;
  } | null;

  ticksSinceLastFight: number;
  lastFightResult?: import("./fight").FightResult | null;
}
