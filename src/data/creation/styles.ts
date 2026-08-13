import type { AttributeBlock } from "@/types";
import type { StyleId } from "@/types";

export interface StyleOption {
  id: StyleId;
  emoji: string;
  label: string;
  flavor: string;
  bonuses: Partial<AttributeBlock>;
  maluses: Partial<AttributeBlock>;
}

export const STYLES: StyleOption[] = [
  {
    id: "boxer",
    emoji: "🥊",
    label: "Boxeur",
    flavor: "Des mains lourdes et une obsession : garder le combat debout.",
    bonuses: { boxing: 10, power: 6, accuracy: 6 },
    maluses: { wrestling: -8, bjj: -8, takedownDefense: -6 },
  },
  {
    id: "wrestler",
    emoji: "🤼",
    label: "Lutteur",
    flavor: "Tu as passe plus de temps sur les tapis que devant une console.",
    bonuses: { wrestling: 10, groundControl: 6, cardio: 6 },
    maluses: { striking: -6, submissionDefense: -6, boxing: -4 },
  },
  {
    id: "bjj",
    emoji: "🥋",
    label: "BJJ",
    flavor: "Le sol n'est pas une position de faiblesse. C'est ton territoire.",
    bonuses: { bjj: 10, submissionOffense: 8, submissionDefense: 6 },
    maluses: { striking: -6, takedownOffense: -4, power: -4 },
  },
  {
    id: "muay_thai",
    emoji: "🦵",
    label: "Muay Thai",
    flavor: "Coudes, genoux, low kicks : tu veux faire mal partout.",
    bonuses: { kicks: 10, kickboxing: 8, strikingDefense: 4 },
    maluses: { wrestling: -6, bjj: -6, takedownDefense: -4 },
  },
  {
    id: "judo",
    emoji: "🥋",
    label: "Judo",
    flavor: "Une projection suffit parfois a changer un combat.",
    bonuses: { takedownOffense: 10, groundControl: 6, strength: 4 },
    maluses: { striking: -6, cardio: -4, submissionOffense: -4 },
  },
  {
    id: "sambo",
    emoji: "🇷🇺",
    label: "Sambo",
    flavor: "Une discipline dure, venue du froid, sans compromis.",
    bonuses: { wrestling: 8, groundControl: 6, aggression: 6 },
    maluses: { boxing: -6, strikingDefense: -4, composure: -4 },
  },
  {
    id: "modern_mma",
    emoji: "🧠",
    label: "MMA moderne",
    flavor: "Profil equilibre. Aucune enorme faiblesse, aucun gros avantage.",
    bonuses: { fightIQ: 4, cardio: 2, discipline: 2 },
    maluses: {},
  },
];

export function getStyle(id: StyleId): StyleOption {
  const s = STYLES.find((s) => s.id === id);
  if (!s) throw new Error(`Style inconnu: ${id}`);
  return s;
}
