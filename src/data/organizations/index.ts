import type { Organization } from "@/types";
import { WEIGHT_CLASSES } from "./weightClasses";

const ALL_WC_IDS = WEIGHT_CLASSES.map((w) => w.id);

/**
 * Organisations entièrement fictives (section 128 — pas de branding réel
 * tant qu'aucune licence n'est disponible). Trois paliers volontairement
 * non-hiérarchiques (section 39) : aucun chemin n'est objectivement
 * optimal, chacun a des forces différentes.
 */
export const ORGANIZATIONS: Organization[] = [
  {
    id: "acs",
    name: "Apex Cage Series",
    shortName: "ACS",
    tier: "regional",
    country: "France",
    prestige: 25,
    money: 20,
    audience: 20,
    rosterQuality: 30,
    recruitmentDifficulty: 10,
    contractStyle: "per_fight",
    weightClasses: ALL_WC_IDS,
  },
  {
    id: "gfl",
    name: "Global Fight League",
    shortName: "GFL",
    tier: "mid",
    country: "Pologne",
    prestige: 55,
    money: 65,
    audience: 50,
    rosterQuality: 60,
    recruitmentDifficulty: 45,
    contractStyle: "guaranteed",
    weightClasses: ALL_WC_IDS,
  },
  {
    id: "sfc",
    name: "Supreme Fighting Championship",
    shortName: "SFC",
    tier: "elite",
    country: "USA",
    prestige: 95,
    money: 90,
    audience: 95,
    rosterQuality: 92,
    recruitmentDifficulty: 85,
    contractStyle: "per_fight",
    weightClasses: ALL_WC_IDS,
  },
];

export function getOrganization(id: string): Organization {
  const org = ORGANIZATIONS.find((o) => o.id === id);
  if (!org) throw new Error(`Organisation inconnue: ${id}`);
  return org;
}
