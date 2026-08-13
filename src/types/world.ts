import type { Fighter } from "./fighter";
import type { Organization, Title, WeightClass } from "./organization";
import type { FightResult } from "./fight";

export interface RankingEntry {
  fighterId: string;
  score: number;
}

export interface RankingBoard {
  organizationId: string;
  weightClassId: string;
  championId: string | null;
  top15: RankingEntry[]; // trié desc, index 0 = #1 (hors champion)
}

export interface NewsItem {
  id: string;
  date: string;
  headline: string;
  detail?: string;
}

export interface WorldState {
  databaseVersion: string;
  currentDate: string;
  organizations: Organization[];
  weightClasses: WeightClass[];
  titles: Title[];
  fighters: Record<string, Fighter>; // NPC + joueur
  rankings: RankingBoard[];
  news: NewsItem[];
  recentFights: FightResult[]; // fenêtre glissante, pour l'actu et le SoS
}
