import type { CareerCreationChoices } from "@/types";
import { getStyle } from "@/data/creation/styles";
import { getOrigin } from "@/data/creation/origins";
import { getLifestyle } from "@/data/creation/lifestyles";
import { getEntourage } from "@/data/creation/entourages";

/**
 * Score indicatif (pas une donnee de jeu exacte) combinant les 4 choix de
 * creation, pour donner au joueur un retour immediat — a la maniere d'une
 * note en etoiles — sur la solidite de son profil de depart (section 15/16 :
 * reste une estimation, le potentiel cache reel n'est jamais revele).
 */
export function computeStartingQualityScore(choices: CareerCreationChoices): number {
  const style = getStyle(choices.styleId);
  const origin = getOrigin(choices.originId);
  const lifestyle = getLifestyle(choices.lifestyleId);
  const entourage = getEntourage(choices.entourageId);

  const styleScore = Object.values(style.bonuses).reduce((sum: number, v) => sum + (v ?? 0), 0);
  const originScore = Object.values(origin.bonuses).reduce((sum: number, v) => sum + (v ?? 0), 0);
  const lifestyleScore = (lifestyle.progressionModifier - 1) * 40 + (lifestyle.recoveryModifier - 1) * 10;
  const entourageScore = (entourage.opportunityModifier - 1) * 25;
  const popularityScore = origin.startingPopularity * 0.5;

  return styleScore + originScore + lifestyleScore + entourageScore + popularityScore;
}

export function scoreToStars(score: number): number {
  if (score < 20) return 1;
  if (score < 32) return 2;
  if (score < 44) return 3;
  if (score < 56) return 4;
  return 5;
}
