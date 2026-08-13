import type { EntourageId } from "@/types";

export interface EntourageOption {
  id: EntourageId;
  emoji: string;
  label: string;
  flavor: string;
  startingRelationships: { manager: number; gym: number };
  opportunityModifier: number; // influence les offres de contrat
  scandalRiskModifier: number;
  moraleStability: number;
}

export const ENTOURAGES: EntourageOption[] = [
  {
    id: "family",
    emoji: "👨‍👩‍👦",
    label: "Famille",
    flavor: "Stabilite, peu de scandales, un socle solide.",
    startingRelationships: { manager: 40, gym: 30 },
    opportunityModifier: 0.9,
    scandalRiskModifier: 0.6,
    moraleStability: 1.3,
  },
  {
    id: "ambitious_manager",
    emoji: "🦈",
    label: "Manager ambitieux",
    flavor: "Meilleures opportunites, mais commissions et prises de risque.",
    startingRelationships: { manager: 55, gym: 15 },
    opportunityModifier: 1.3,
    scandalRiskModifier: 1.1,
    moraleStability: 0.9,
  },
  {
    id: "childhood_friend",
    emoji: "🤝",
    label: "Ami d'enfance",
    flavor: "Loyaute totale, mais un reseau limite.",
    startingRelationships: { manager: 60, gym: 25 },
    opportunityModifier: 0.8,
    scandalRiskModifier: 0.8,
    moraleStability: 1.1,
  },
  {
    id: "super_agent",
    emoji: "💼",
    label: "Super-agent",
    flavor: "Reseau enorme, mais couteux et exigeant.",
    startingRelationships: { manager: 35, gym: 20 },
    opportunityModifier: 1.5,
    scandalRiskModifier: 1.0,
    moraleStability: 0.85,
  },
  {
    id: "crew",
    emoji: "🧑‍🤝‍🧑",
    label: "Bande d'amis",
    flavor: "Moral et popularite, mais risques d'incidents.",
    startingRelationships: { manager: 30, gym: 20 },
    opportunityModifier: 1.0,
    scandalRiskModifier: 1.3,
    moraleStability: 0.95,
  },
];

export function getEntourage(id: EntourageId): EntourageOption {
  const e = ENTOURAGES.find((e) => e.id === id);
  if (!e) throw new Error(`Entourage inconnu: ${id}`);
  return e;
}
