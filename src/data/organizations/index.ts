import type { Organization } from "@/types";
import { WEIGHT_CLASSES } from "./weightClasses";

const ALL_WC_IDS = WEIGHT_CLASSES.map((w) => w.id);

/**
 * Organisations reelles du MMA mondial (section 4/39 du cahier des
 * charges), utilisees ici uniquement comme cadre/decor pour la carriere.
 *
 * IMPORTANT — separation stricte donnees reelles / donnees inventees
 * (section 5/128) : seuls les NOMS de ces organisations sont reels. Tout
 * le reste — roster, prestige, argent, difficulte de recrutement,
 * classements — est entierement simule par le moteur de jeu pour les
 * besoins de la partie. Rien ici n'est presente comme une donnee
 * officielle, aucun logo ni visuel proprietaire n'est utilise (le roster
 * reste fictif sauf import explicite — voir data/fighters/realRoster.ts).
 *
 * Trois paliers, demandes explicitement :
 * - regional (tremplin) : ARES, HEXAGONE, Cage Warriors
 * - confirme : Oktagon MMA, KSW, PFL
 * - elite : UFC, le sommet
 * A l'interieur d'un meme palier, aucun chemin n'est objectivement
 * optimal (section 39) — chaque organisation a ses forces.
 */
export const ORGANIZATIONS: Organization[] = [
  {
    id: "hexagone",
    name: "HEXAGONE MMA",
    shortName: "HEXAGONE",
    tier: "regional",
    country: "France",
    prestige: 22,
    money: 12,
    audience: 18,
    rosterQuality: 32,
    recruitmentDifficulty: 5,
    contractStyle: "per_fight",
    weightClasses: ALL_WC_IDS,
  },
  {
    id: "ares",
    name: "ARES FC",
    shortName: "ARES",
    tier: "regional",
    country: "France",
    prestige: 30,
    money: 18,
    audience: 26,
    rosterQuality: 38,
    recruitmentDifficulty: 7,
    contractStyle: "per_fight",
    weightClasses: ALL_WC_IDS,
  },
  {
    id: "cw",
    name: "Cage Warriors",
    shortName: "CW",
    tier: "regional",
    country: "Royaume-Uni",
    prestige: 35,
    money: 15,
    audience: 30,
    rosterQuality: 40,
    recruitmentDifficulty: 8,
    contractStyle: "per_fight",
    weightClasses: ALL_WC_IDS,
  },
  {
    id: "oktagon",
    name: "Oktagon MMA",
    shortName: "OKTAGON",
    tier: "mid",
    country: "Republique Tcheque",
    prestige: 48,
    money: 58,
    audience: 48,
    rosterQuality: 53,
    recruitmentDifficulty: 35,
    contractStyle: "guaranteed",
    weightClasses: ALL_WC_IDS,
  },
  {
    id: "ksw",
    name: "KSW",
    shortName: "KSW",
    tier: "mid",
    country: "Pologne",
    prestige: 55,
    money: 70,
    audience: 55,
    rosterQuality: 58,
    recruitmentDifficulty: 40,
    contractStyle: "guaranteed",
    weightClasses: ALL_WC_IDS,
  },
  {
    id: "pfl",
    name: "PFL",
    shortName: "PFL",
    tier: "mid",
    country: "USA",
    prestige: 68,
    money: 78,
    audience: 65,
    rosterQuality: 70,
    recruitmentDifficulty: 55,
    contractStyle: "guaranteed",
    weightClasses: ALL_WC_IDS,
  },
  {
    id: "ufc",
    name: "UFC",
    shortName: "UFC",
    tier: "elite",
    country: "USA",
    prestige: 97,
    money: 95,
    audience: 98,
    rosterQuality: 95,
    recruitmentDifficulty: 85,
    contractStyle: "per_fight",
    weightClasses: ALL_WC_IDS,
  },
];

export const REGIONAL_ORG_IDS = ["hexagone", "ares", "cw"];
export const MID_ORG_IDS = ["oktagon", "ksw", "pfl"];

export function getOrganization(id: string): Organization {
  const org = ORGANIZATIONS.find((o) => o.id === id);
  if (!org) throw new Error(`Organisation inconnue: ${id}`);
  return org;
}
