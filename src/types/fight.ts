export type FightMethod =
  | "ko"
  | "tko"
  | "submission"
  | "unanimous_decision"
  | "split_decision"
  | "majority_decision"
  | "draw"
  | "doctor_stoppage"
  | "dq"
  | "no_contest";

export type Gameplan =
  | "pressure"
  | "counter_striker"
  | "hunt_ko"
  | "wrestling_heavy"
  | "submission_hunting"
  | "cage_control"
  | "point_fighting"
  | "balanced"
  | "survive_early_push_late";

export type CampFocus =
  | "striking"
  | "wrestling"
  | "grappling"
  | "cardio"
  | "tactical"
  | "weight_cut"
  | "balanced";

export interface RoundStats {
  round: number;
  significantStrikesLanded: { fighterA: number; fighterB: number };
  significantStrikesAttempted: { fighterA: number; fighterB: number };
  headStrikes: { fighterA: number; fighterB: number };
  bodyStrikes: { fighterA: number; fighterB: number };
  legStrikes: { fighterA: number; fighterB: number };
  takedowns: { fighterA: number; fighterB: number };
  controlTimeSeconds: { fighterA: number; fighterB: number };
  submissionAttempts: { fighterA: number; fighterB: number };
  knockdowns: { fighterA: number; fighterB: number };
  judgeScores?: { fighterA: number; fighterB: number }[]; // 3 juges
  summary: string;
}

export interface FightResult {
  id: string;
  date: string;
  organizationId: string;
  eventName: string;
  weightClassId: string;
  fighterAId: string;
  fighterBId: string;
  winnerId: string | null; // null = draw / no contest
  method: FightMethod;
  finishingMove?: string;
  round: number;
  time: string; // "2:41"
  rounds: RoundStats[];
  performanceRating: { fighterA: number; fighterB: number }; // 0-100
  fightImportanceScore: number;
  isTitleFight: boolean;
  isUpset: boolean;
  bonusAwards: string[]; // "fight_of_the_night", etc.
  /** Prime en euros associee aux bonusAwards, calculee selon le palier de l'organisation (section demandee). */
  bonusPayout?: number;
}

export interface FightRecord {
  fight: FightResult;
  opponentId: string;
  opponentName: string;
  opponentRecordAtTime: string;
  result: "win" | "loss" | "draw" | "no_contest";
}

export interface FighterFightContext {
  fighterId: string;
  gameplan: Gameplan;
  campFocus: CampFocus;
  campQuality: number; // 0-100, calculé à partir de gym + focus + forme + narrative
}
