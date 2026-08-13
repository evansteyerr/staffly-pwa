import type { HiddenTrait } from "@/types";

export interface HiddenTraitInfo {
  id: HiddenTrait;
  label: string;
  description: string;
  rarity: number; // poids relatif de tirage
}

/** Section 14 — traits caches tires a la creation, revelables en carriere. */
export const HIDDEN_TRAITS: HiddenTraitInfo[] = [
  { id: "iron_chin", label: "Menton de fer", description: "Encaisse beaucoup mieux que la moyenne.", rarity: 6 },
  { id: "glass_chin", label: "Menton fragile", description: "Vulnerable aux coups lourds.", rarity: 6 },
  { id: "cardio_freak", label: "Moteur infatigable", description: "Cardio exceptionnel sur la duree.", rarity: 6 },
  { id: "natural_power", label: "Puissance naturelle", description: "Fait plus mal que ses stats ne le laissent penser.", rarity: 6 },
  { id: "slow_learner", label: "Apprentissage lent", description: "Progresse plus lentement vers son potentiel.", rarity: 6 },
  { id: "fast_learner", label: "Apprentissage rapide", description: "Progresse plus vite vers son potentiel.", rarity: 6 },
  { id: "injury_prone", label: "Sujet aux blessures", description: "Risque de blessure augmente.", rarity: 6 },
  { id: "clutch_performer", label: "Joueur des grands moments", description: "Meilleur dans les combats importants.", rarity: 5 },
  { id: "pressure_fighter", label: "Sous pression", description: "Performe mieux quand outsider.", rarity: 5 },
  { id: "bad_weight_cutter", label: "Mauvais cutter", description: "Risque accru de rater le poids.", rarity: 5 },
  { id: "media_natural", label: "Naturel devant les cameras", description: "Gagne plus de popularite.", rarity: 5 },
  { id: "late_bloomer", label: "Eclosion tardive", description: "Prime decalee plus tard dans la carriere.", rarity: 5 },
  { id: "early_peak", label: "Pic precoce", description: "Prime plus tot, declin plus tot.", rarity: 5 },
  { id: "gym_rat", label: "Rat de salle", description: "Progression accrue en camp.", rarity: 5 },
  { id: "big_fight_player", label: "Grand combattant", description: "Performance boostee lors des gros events.", rarity: 4 },
  { id: "mentally_fragile", label: "Fragile mentalement", description: "Moral plus volatile.", rarity: 4 },
  { id: "comeback_king", label: "Roi du comeback", description: "Meilleur apres une defaite.", rarity: 4 },
  { id: "submission_magnet", label: "Aimant a soumissions", description: "Plus souvent en danger au sol.", rarity: 4 },
  { id: "cold_blooded", label: "Sang-froid", description: "Tres stable sous la pression des juges/finish.", rarity: 4 },
  { id: "warrior", label: "Guerrier", description: "Encaisse la douleur, continue d'avancer.", rarity: 4 },
  { id: "technical_genius", label: "Genie technique", description: "Fight IQ effectif superieur en combat.", rarity: 4 },
];

export function getHiddenTraitInfo(id: HiddenTrait): HiddenTraitInfo {
  const t = HIDDEN_TRAITS.find((t) => t.id === id);
  if (!t) throw new Error(`Trait cache inconnu: ${id}`);
  return t;
}
