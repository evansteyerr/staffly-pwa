export type OrgTier = "regional" | "mid" | "elite";

/**
 * Organisations 100% fictives pour le MVP (section 128 — pas de branding
 * réel tant qu'une licence n'est pas disponible). L'architecture permet de
 * remplacer/étendre ce fichier par un roster réel via l'admin importer
 * (V3) sans changer le moteur.
 */
export interface Organization {
  id: string;
  name: string;
  shortName: string;
  tier: OrgTier;
  country: string;
  prestige: number; // 0-100
  money: number; // 0-100, capacité financière
  audience: number; // 0-100
  rosterQuality: number; // 0-100
  recruitmentDifficulty: number; // 0-100, plus haut = plus dur d'y entrer
  contractStyle: "per_fight" | "guaranteed";
  weightClasses: string[]; // weightClassId[]
}

export interface WeightClass {
  id: string;
  label: string;
  gender: "male" | "female";
  maxWeightKg: number;
}

export interface Title {
  id: string;
  organizationId: string;
  weightClassId: string;
  label: string; // "Championnat des poids légers"
  currentChampionId: string | null;
  interim: boolean;
}

export interface TitleReign {
  titleId: string;
  fighterId: string;
  wonOn: string;
  lostOn?: string;
  defenses: number;
}
