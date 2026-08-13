import type { AttributeBlock } from "@/types";
import type { OriginId } from "@/types";

export interface OriginOption {
  id: OriginId;
  emoji: string;
  label: string;
  flavor: string;
  bonuses: Partial<AttributeBlock>;
  maluses: Partial<AttributeBlock>;
  startingMoney: number;
  startingPopularity: number;
  startingFlags: string[];
}

export const ORIGINS: OriginOption[] = [
  {
    id: "wrestling_prodigy",
    emoji: "🥇",
    label: "Champion de lutte junior",
    flavor: "Depuis tes 8 ans, tu vis sur les tapis.",
    bonuses: { wrestling: 8, discipline: 8, cardio: 6 },
    maluses: { striking: -4 },
    startingMoney: 2000,
    startingPopularity: 2,
    startingFlags: ["origin_wrestling_prodigy"],
  },
  {
    id: "boxing_family",
    emoji: "🥊",
    label: "Famille de boxeurs",
    flavor: "Chez toi, les gants etaient deja la avant ta naissance.",
    bonuses: { boxing: 8, composure: 6 },
    maluses: {},
    startingMoney: 3000,
    startingPopularity: 6,
    startingFlags: ["origin_boxing_family"],
  },
  {
    id: "hard_neighborhood",
    emoji: "🏚️",
    label: "Quartier difficile",
    flavor: "Personne ne t'a donne quoi que ce soit.",
    bonuses: { chin: 8, aggression: 8, durability: 6 },
    maluses: {},
    startingMoney: 200,
    startingPopularity: 1,
    startingFlags: ["origin_hard_neighborhood"],
  },
  {
    id: "strict_family",
    emoji: "👨‍👩‍👦",
    label: "Famille tres encadrante",
    flavor: "La discipline n'a jamais ete une option chez toi.",
    bonuses: { discipline: 10, composure: 6 },
    maluses: {},
    startingMoney: 2500,
    startingPopularity: 2,
    startingFlags: ["origin_strict_family"],
  },
  {
    id: "wealthy_family",
    emoji: "💰",
    label: "Famille aisee",
    flavor: "Meilleure salle, meilleurs soins, mais une faim a prouver.",
    bonuses: { recovery: 6, cardio: 4 },
    maluses: { aggression: -4 },
    startingMoney: 15000,
    startingPopularity: 3,
    startingFlags: ["origin_wealthy_family"],
  },
  {
    id: "social_media_star",
    emoji: "🎥",
    label: "Star des reseaux",
    flavor: "Tu es connu avant meme ton premier combat.",
    bonuses: {},
    maluses: { discipline: -4 },
    startingMoney: 4000,
    startingPopularity: 12,
    startingFlags: ["origin_social_media_star"],
  },
  {
    id: "former_athlete",
    emoji: "⚽",
    label: "Ancien sportif de haut niveau",
    flavor: "Un autre sport t'a deja appris a souffrir et a gagner.",
    bonuses: { cardio: 8, explosiveness: 6, discipline: 4 },
    maluses: {},
    startingMoney: 3000,
    startingPopularity: 4,
    startingFlags: ["origin_former_athlete"],
  },
  {
    id: "late_bloomer",
    emoji: "🕒",
    label: "Revele tardivement",
    flavor: "Tu as commence tard, mais ta tete est deja pretes.",
    bonuses: { composure: 8, fightIQ: 6 },
    maluses: {},
    startingMoney: 1500,
    startingPopularity: 1,
    startingFlags: ["origin_late_bloomer", "trait_late_bloomer_marker"],
  },
];

export function getOrigin(id: OriginId): OriginOption {
  const o = ORIGINS.find((o) => o.id === id);
  if (!o) throw new Error(`Origine inconnue: ${id}`);
  return o;
}
