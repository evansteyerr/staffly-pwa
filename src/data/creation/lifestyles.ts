import type { LifestyleId } from "@/types";

export interface LifestyleOption {
  id: LifestyleId;
  emoji: string;
  label: string;
  flavor: string;
  progressionModifier: number; // multiplicateur de gain d'attributs
  recoveryModifier: number;
  popularityGainModifier: number;
  moraleVolatility: number; // + = plus instable
  moneyDrain: number; // dépense mensuelle relative
}

export const LIFESTYLES: LifestyleOption[] = [
  {
    id: "ascetic",
    emoji: "🥗",
    label: "Ascete",
    flavor: "Nutrition parfaite, peu de sorties, discipline maximale.",
    progressionModifier: 1.15,
    recoveryModifier: 1.2,
    popularityGainModifier: 0.85,
    moraleVolatility: 1.2,
    moneyDrain: 0.8,
  },
  {
    id: "balanced",
    emoji: "⚖️",
    label: "Equilibre",
    flavor: "Un profil neutre, sans exces.",
    progressionModifier: 1.0,
    recoveryModifier: 1.0,
    popularityGainModifier: 1.0,
    moraleVolatility: 1.0,
    moneyDrain: 1.0,
  },
  {
    id: "party",
    emoji: "🎉",
    label: "Fetard",
    flavor: "Tu vis vite, et ca se voit parfois a l'entrainement.",
    progressionModifier: 0.85,
    recoveryModifier: 0.85,
    popularityGainModifier: 1.25,
    moraleVolatility: 1.3,
    moneyDrain: 1.3,
  },
  {
    id: "businessman",
    emoji: "💻",
    label: "Businessman",
    flavor: "Tu geres ta carriere comme une entreprise.",
    progressionModifier: 0.95,
    recoveryModifier: 1.0,
    popularityGainModifier: 1.1,
    moraleVolatility: 0.9,
    moneyDrain: 0.9,
  },
];

export function getLifestyle(id: LifestyleId): LifestyleOption {
  const l = LIFESTYLES.find((l) => l.id === id);
  if (!l) throw new Error(`Mode de vie inconnu: ${id}`);
  return l;
}
