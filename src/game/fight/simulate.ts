import type { Fighter, FightMethod, FightResult, Gameplan, RoundStats } from "@/types";
import { Rng } from "@/game/rng/prng";

export interface FightSimInput {
  fighterA: Fighter;
  fighterB: Fighter;
  gameplanA: Gameplan;
  gameplanB: Gameplan;
  campQualityA: number; // 0-100
  campQualityB: number; // 0-100
  maxRounds: 3 | 5;
  organizationId: string;
  eventName: string;
  date: string;
  isTitleFight: boolean;
  rivalryIntensity: number; // 0-100
  homeAdvantageFor: "A" | "B" | null;
}

const KO_FINISHES = ["Crochet", "Direct du droit", "Uppercut", "Head kick", "Genou volant", "Coude", "Spinning backfist", "Ground and pound", "Coup au corps"];
const SUB_FINISHES = ["Etranglement arriere", "Guillotine", "Triangle", "Cle de bras", "Kimura", "Heel hook", "D'Arce", "Anaconda", "Triangle de bras"];

function sigmoid(diff: number, scale: number): number {
  return 1 / (1 + Math.exp(-diff / scale));
}

interface FighterRuntimeState {
  fighter: Fighter;
  gameplan: Gameplan;
  campQuality: number;
  damage: number; // 0-100, cumulatif
  cardioLeft: number; // 0-100
  knockdowns: number;
  controlSeconds: number;
  strikesLanded: number;
  strikesAttempted: number;
  headStrikes: number;
  bodyStrikes: number;
  legStrikes: number;
  takedowns: number;
  submissionAttempts: number;
  roundsWonScore: number[];
}

function initRuntime(fighter: Fighter, gameplan: Gameplan, campQuality: number): FighterRuntimeState {
  return {
    fighter,
    gameplan,
    campQuality,
    damage: 0,
    cardioLeft: 100,
    knockdowns: 0,
    controlSeconds: 0,
    strikesLanded: 0,
    strikesAttempted: 0,
    headStrikes: 0,
    bodyStrikes: 0,
    legStrikes: 0,
    takedowns: 0,
    submissionAttempts: 0,
    roundsWonScore: [],
  };
}

function offensiveStrikingRating(s: FighterRuntimeState): number {
  const a = s.fighter.attributes;
  const base = a.striking * 0.35 + a.boxing * 0.2 + a.kickboxing * 0.2 + a.power * 0.15 + a.accuracy * 0.1;
  const gpBonus = s.gameplan === "pressure" || s.gameplan === "hunt_ko" ? 6 : s.gameplan === "point_fighting" ? 2 : 0;
  return base + gpBonus;
}

function defensiveStrikingRating(s: FighterRuntimeState): number {
  const a = s.fighter.attributes;
  return a.strikingDefense * 0.6 + a.fightIQ * 0.2 + a.composure * 0.2;
}

function takedownRating(s: FighterRuntimeState): number {
  const a = s.fighter.attributes;
  const base = a.takedownOffense * 0.6 + a.wrestling * 0.4;
  const gpBonus = s.gameplan === "wrestling_heavy" || s.gameplan === "cage_control" ? 8 : 0;
  return base + gpBonus;
}

function takedownDefenseRating(s: FighterRuntimeState): number {
  const a = s.fighter.attributes;
  return a.takedownDefense * 0.7 + a.fightIQ * 0.3;
}

function groundOffenseRating(s: FighterRuntimeState): number {
  const a = s.fighter.attributes;
  const base = a.groundControl * 0.35 + a.groundAndPound * 0.25 + a.submissionOffense * 0.4;
  const gpBonus = s.gameplan === "submission_hunting" ? 8 : 0;
  return base + gpBonus;
}

function groundDefenseRating(s: FighterRuntimeState): number {
  const a = s.fighter.attributes;
  return a.submissionDefense * 0.55 + a.bjj * 0.3 + a.composure * 0.15;
}

function formMultiplier(fighter: Fighter): number {
  return 0.85 + (fighter.form / 100) * 0.3;
}

function simulateRound(
  round: number,
  A: FighterRuntimeState,
  B: FighterRuntimeState,
  rng: Rng,
  homeAdvantageFor: "A" | "B" | null,
): { stats: RoundStats; finish: { winner: "A" | "B"; method: FightMethod; move: string } | null } {
  const fatigueA = A.cardioLeft / 100;
  const fatigueB = B.cardioLeft / 100;

  const homeBoostA = homeAdvantageFor === "A" ? 1.03 : 1;
  const homeBoostB = homeAdvantageFor === "B" ? 1.03 : 1;

  const strikeOffA = offensiveStrikingRating(A) * formMultiplier(A.fighter) * fatigueA * homeBoostA;
  const strikeOffB = offensiveStrikingRating(B) * formMultiplier(B.fighter) * fatigueB * homeBoostB;
  const strikeDefA = defensiveStrikingRating(A) * (0.6 + fatigueA * 0.4);
  const strikeDefB = defensiveStrikingRating(B) * (0.6 + fatigueB * 0.4);

  const exchanges = rng.int(14, 26);
  let headA = 0, bodyA = 0, legA = 0, headB = 0, bodyB = 0, legB = 0;
  let landedA = 0, landedB = 0, attemptedA = 0, attemptedB = 0;
  let knockdownsA = 0, knockdownsB = 0;

  for (let i = 0; i < exchanges; i++) {
    // A frappe B
    attemptedA++;
    const pHitA = sigmoid(strikeOffA - strikeDefB, 18);
    if (rng.chance(pHitA)) {
      landedA++;
      const target = rng.next();
      if (target < 0.55) headA++; else if (target < 0.85) bodyA++; else legA++;
      const dmg = rng.float(0.8, 2.6) * (B.fighter.attributes.durability > 70 ? 0.85 : 1) * (target < 0.55 ? 1.3 : 1);
      B.damage += dmg;
      B.cardioLeft = Math.max(0, B.cardioLeft - dmg * 0.4);
      if (rng.chance(0.05 + Math.max(0, (strikeOffA - B.fighter.attributes.chin) / 200))) {
        knockdownsA++;
        B.damage += rng.float(6, 14);
      }
    }
    // B frappe A
    attemptedB++;
    const pHitB = sigmoid(strikeOffB - strikeDefA, 18);
    if (rng.chance(pHitB)) {
      landedB++;
      const target = rng.next();
      if (target < 0.55) headB++; else if (target < 0.85) bodyB++; else legB++;
      const dmg = rng.float(0.8, 2.6) * (A.fighter.attributes.durability > 70 ? 0.85 : 1) * (target < 0.55 ? 1.3 : 1);
      A.damage += dmg;
      A.cardioLeft = Math.max(0, A.cardioLeft - dmg * 0.4);
      if (rng.chance(0.05 + Math.max(0, (strikeOffB - A.fighter.attributes.chin) / 200))) {
        knockdownsB++;
        A.damage += rng.float(6, 14);
      }
    }
  }

  A.knockdowns += knockdownsA;
  B.knockdowns += knockdownsB;
  A.strikesLanded += landedA; A.strikesAttempted += attemptedA;
  B.strikesLanded += landedB; B.strikesAttempted += attemptedB;
  A.headStrikes += headA; A.bodyStrikes += bodyA; A.legStrikes += legA;
  B.headStrikes += headB; B.bodyStrikes += bodyB; B.legStrikes += legB;

  // check KO/TKO en striking
  const koCheck = checkKnockout(A, B, rng);
  if (koCheck) {
    return { stats: buildStats(round, A, B, landedA, landedB, attemptedA, attemptedB, headA, headB, bodyA, bodyB, legA, legB, knockdownsA, knockdownsB, 0, 0), finish: koCheck };
  }

  // Phase de takedown / sol
  let takedownsA = 0, takedownsB = 0, controlA = 0, controlB = 0;
  let subAttemptsA = 0, subAttemptsB = 0;
  let submissionFinish: { winner: "A" | "B"; method: FightMethod; move: string } | null = null;

  const wantsTdA = A.gameplan === "wrestling_heavy" || A.gameplan === "submission_hunting" || A.gameplan === "cage_control";
  const wantsTdB = B.gameplan === "wrestling_heavy" || B.gameplan === "submission_hunting" || B.gameplan === "cage_control";
  const tdAttemptsA = wantsTdA ? rng.int(1, 3) : rng.chance(0.3) ? 1 : 0;
  const tdAttemptsB = wantsTdB ? rng.int(1, 3) : rng.chance(0.3) ? 1 : 0;

  for (let i = 0; i < tdAttemptsA; i++) {
    const pTd = sigmoid(takedownRating(A) - takedownDefenseRating(B), 16);
    if (rng.chance(pTd)) {
      takedownsA++;
      const controlTime = rng.int(20, 90);
      controlA += controlTime;
      const pGroundDmg = sigmoid(groundOffenseRating(A) - groundDefenseRating(B), 20);
      if (rng.chance(pGroundDmg)) B.damage += rng.float(2, 6);
      const pSub = sigmoid((A.fighter.attributes.submissionOffense - B.fighter.attributes.submissionDefense) - 5, 22);
      if (rng.chance(pSub * 0.35)) {
        subAttemptsA++;
        if (rng.chance(0.4)) {
          submissionFinish = { winner: "A", method: "submission", move: pickSub(rng) };
        }
      }
    }
  }
  if (!submissionFinish) {
    for (let i = 0; i < tdAttemptsB; i++) {
      const pTd = sigmoid(takedownRating(B) - takedownDefenseRating(A), 16);
      if (rng.chance(pTd)) {
        takedownsB++;
        const controlTime = rng.int(20, 90);
        controlB += controlTime;
        const pGroundDmg = sigmoid(groundOffenseRating(B) - groundDefenseRating(A), 20);
        if (rng.chance(pGroundDmg)) A.damage += rng.float(2, 6);
        const pSub = sigmoid((B.fighter.attributes.submissionOffense - A.fighter.attributes.submissionDefense) - 5, 22);
        if (rng.chance(pSub * 0.35)) {
          subAttemptsB++;
          if (rng.chance(0.4)) {
            submissionFinish = { winner: "B", method: "submission", move: pickSub(rng) };
          }
        }
      }
    }
  }

  A.takedowns += takedownsA; B.takedowns += takedownsB;
  A.controlSeconds += controlA; B.controlSeconds += controlB;
  A.submissionAttempts += subAttemptsA; B.submissionAttempts += subAttemptsB;

  const stats = buildStats(round, A, B, landedA, landedB, attemptedA, attemptedB, headA, headB, bodyA, bodyB, legA, legB, knockdownsA, knockdownsB, takedownsA, takedownsB, controlA, controlB, subAttemptsA, subAttemptsB);

  if (submissionFinish) return { stats, finish: submissionFinish };

  // recuperation partielle de cardio entre rounds
  A.cardioLeft = Math.min(100, A.cardioLeft + A.fighter.attributes.recovery * 0.12);
  B.cardioLeft = Math.min(100, B.cardioLeft + B.fighter.attributes.recovery * 0.12);

  const scoreA = landedA * 1 + takedownsA * 5 + controlA * 0.03 + knockdownsA * 15;
  const scoreB = landedB * 1 + takedownsB * 5 + controlB * 0.03 + knockdownsB * 15;
  A.roundsWonScore.push(scoreA);
  B.roundsWonScore.push(scoreB);

  return { stats, finish: null };
}

function checkKnockout(A: FighterRuntimeState, B: FighterRuntimeState, rng: Rng): { winner: "A" | "B"; method: FightMethod; move: string } | null {
  const thresholdA = 55 + A.fighter.attributes.chin * 0.35 + A.fighter.attributes.durability * 0.15;
  const thresholdB = 55 + B.fighter.attributes.chin * 0.35 + B.fighter.attributes.durability * 0.15;
  const ironChinA = A.fighter.hiddenTraits.includes("iron_chin") ? 1.15 : A.fighter.hiddenTraits.includes("glass_chin") ? 0.8 : 1;
  const ironChinB = B.fighter.hiddenTraits.includes("iron_chin") ? 1.15 : B.fighter.hiddenTraits.includes("glass_chin") ? 0.8 : 1;

  if (A.damage > thresholdA * ironChinA && rng.chance(0.5)) {
    return { winner: "B", method: A.damage > thresholdA * ironChinA * 1.3 ? "ko" : "tko", move: pickKo(rng) };
  }
  if (B.damage > thresholdB * ironChinB && rng.chance(0.5)) {
    return { winner: "A", method: B.damage > thresholdB * ironChinB * 1.3 ? "ko" : "tko", move: pickKo(rng) };
  }
  return null;
}

function pickKo(rng: Rng): string {
  return rng.pick(KO_FINISHES);
}
function pickSub(rng: Rng): string {
  return rng.pick(SUB_FINISHES);
}

function buildStats(
  round: number, A: FighterRuntimeState, B: FighterRuntimeState,
  landedA: number, landedB: number, attemptedA: number, attemptedB: number,
  headA: number, headB: number, bodyA: number, bodyB: number, legA: number, legB: number,
  kdA: number, kdB: number,
  tdA = 0, tdB = 0, ctrlA = 0, ctrlB = 0, subA = 0, subB = 0,
): RoundStats {
  return {
    round,
    significantStrikesLanded: { fighterA: landedA, fighterB: landedB },
    significantStrikesAttempted: { fighterA: attemptedA, fighterB: attemptedB },
    headStrikes: { fighterA: headA, fighterB: headB },
    bodyStrikes: { fighterA: bodyA, fighterB: bodyB },
    legStrikes: { fighterA: legA, fighterB: legB },
    takedowns: { fighterA: tdA, fighterB: tdB },
    controlTimeSeconds: { fighterA: ctrlA, fighterB: ctrlB },
    submissionAttempts: { fighterA: subA, fighterB: subB },
    knockdowns: { fighterA: kdA, fighterB: kdB },
    summary: describeRound(round, landedA, landedB, tdA, tdB, kdA, kdB),
  };
}

function describeRound(round: number, landedA: number, landedB: number, tdA: number, tdB: number, kdA: number, kdB: number): string {
  if (kdA > 0) return `Round ${round} : enorme knockdown pour le coin rouge !`;
  if (kdB > 0) return `Round ${round} : le coin bleu envoie un knockdown !`;
  if (tdA > tdB) return `Round ${round} : controle au sol pour le coin rouge.`;
  if (tdB > tdA) return `Round ${round} : controle au sol pour le coin bleu.`;
  if (landedA > landedB * 1.3) return `Round ${round} : domination au striking, coin rouge.`;
  if (landedB > landedA * 1.3) return `Round ${round} : domination au striking, coin bleu.`;
  return `Round ${round} : round dispute.`;
}

function scoreJudgeRound(a: number, b: number, rng: Rng): { fighterA: number; fighterB: number } {
  const diff = a - b;
  if (Math.abs(diff) < 3) {
    // Rounds serres : petite chance de score inverse (juge different)
    if (rng.chance(0.12)) return diff >= 0 ? { fighterA: 9, fighterB: 10 } : { fighterA: 10, fighterB: 9 };
  }
  if (diff > 25) return { fighterA: 10, fighterB: 8 };
  if (diff < -25) return { fighterA: 8, fighterB: 10 };
  return diff >= 0 ? { fighterA: 10, fighterB: 9 } : { fighterA: 9, fighterB: 10 };
}

export function simulateFight(input: FightSimInput, rng: Rng): FightResult {
  const A = initRuntime(input.fighterA, input.gameplanA, input.campQualityA);
  const B = initRuntime(input.fighterB, input.gameplanB, input.campQualityB);

  const rounds: RoundStats[] = [];
  let finish: { winner: "A" | "B"; method: FightMethod; move: string } | null = null;
  let finishRound: number = input.maxRounds;

  for (let r = 1; r <= input.maxRounds; r++) {
    const { stats, finish: roundFinish } = simulateRound(r, A, B, rng, input.homeAdvantageFor);
    rounds.push(stats);
    if (roundFinish) {
      finish = roundFinish;
      finishRound = r;
      break;
    }
  }

  let method: FightMethod;
  let winnerId: string | null;
  let finishingMove: string | undefined;
  let time = `${rng.int(0, 4)}:${String(rng.int(0, 59)).padStart(2, "0")}`;

  if (finish) {
    method = finish.method;
    winnerId = finish.winner === "A" ? A.fighter.id : B.fighter.id;
    finishingMove = finish.move;
  } else {
    // Decision des 3 juges
    const judgeCards = [1, 2, 3].map(() => {
      let totalA = 0, totalB = 0;
      for (let i = 0; i < rounds.length; i++) {
        const s = scoreJudgeRound(A.roundsWonScore[i] ?? 0, B.roundsWonScore[i] ?? 0, rng);
        totalA += s.fighterA;
        totalB += s.fighterB;
      }
      return totalA === totalB ? "draw" : totalA > totalB ? "A" : "B";
    });
    const votesA = judgeCards.filter((v) => v === "A").length;
    const votesB = judgeCards.filter((v) => v === "B").length;
    const votesDraw = judgeCards.filter((v) => v === "draw").length;

    if (votesA === 3 || votesB === 3) {
      method = "unanimous_decision";
    } else if (votesDraw >= 1 && votesA !== votesB) {
      method = "majority_decision";
    } else if (votesA !== votesB) {
      method = "split_decision";
    } else {
      method = "draw";
    }
    winnerId = votesA > votesB ? A.fighter.id : votesB > votesA ? B.fighter.id : null;
    time = "5:00";
    finishRound = input.maxRounds;
  }

  const perfA = computePerformanceRating(A, B, winnerId === A.fighter.id);
  const perfB = computePerformanceRating(B, A, winnerId === B.fighter.id);

  const preFightFavoriteA = estimateWinProbability(A.fighter, B.fighter);
  const isUpset = (winnerId === A.fighter.id && preFightFavoriteA < 0.32) || (winnerId === B.fighter.id && preFightFavoriteA > 0.68);

  const importance = computeFightImportance(input);

  return {
    id: `fight-${input.date}-${A.fighter.id}-${B.fighter.id}`,
    date: input.date,
    organizationId: input.organizationId,
    eventName: input.eventName,
    weightClassId: A.fighter.weightClass,
    fighterAId: A.fighter.id,
    fighterBId: B.fighter.id,
    winnerId,
    method,
    finishingMove,
    round: finishRound,
    time,
    rounds,
    performanceRating: { fighterA: perfA, fighterB: perfB },
    fightImportanceScore: importance,
    isTitleFight: input.isTitleFight,
    isUpset,
    bonusAwards: computeBonusAwards(method, finishRound, rounds.length),
  };
}

function computePerformanceRating(self: FighterRuntimeState, opponent: FighterRuntimeState, won: boolean): number {
  const strikeDiff = self.strikesLanded - opponent.strikesLanded;
  const base = 50 + strikeDiff * 0.6 + self.takedowns * 4 + self.submissionAttempts * 3 + self.knockdowns * 12;
  const winBonus = won ? 12 : -6;
  return Math.max(0, Math.min(100, Math.round(base + winBonus)));
}

function computeBonusAwards(method: FightMethod, finishRound: number, totalRounds: number): string[] {
  const awards: string[] = [];
  if ((method === "ko" || method === "tko") && finishRound === 1) awards.push("performance_of_the_night");
  if (method === "submission" && finishRound <= 2) awards.push("performance_of_the_night");
  if (finishRound === totalRounds && (method === "split_decision" || method === "unanimous_decision")) {
    awards.push("fight_of_the_night");
  }
  return awards;
}

/** Estimation grossiere de probabilite de victoire pre-combat (pour l'upset flag et l'UI). */
export function estimateWinProbability(fighterA: Fighter, fighterB: Fighter): number {
  const ratingA = overallFightRating(fighterA);
  const ratingB = overallFightRating(fighterB);
  return sigmoid(ratingA - ratingB, 14);
}

function overallFightRating(f: Fighter): number {
  const a = f.attributes;
  return (
    a.striking * 0.15 + a.power * 0.1 + a.wrestling * 0.1 + a.bjj * 0.08 +
    a.cardio * 0.12 + a.chin * 0.1 + a.fightIQ * 0.15 + a.strikingDefense * 0.1 +
    a.takedownDefense * 0.1
  ) * formMultiplier(f);
}

function computeFightImportance(input: FightSimInput): number {
  let score = 20;
  if (input.isTitleFight) score += 40;
  score += input.rivalryIntensity * 0.2;
  score += (input.fighterA.popularity + input.fighterB.popularity) * 0.15;
  return Math.round(Math.min(100, score));
}
