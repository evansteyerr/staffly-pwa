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
 * officielle, aucun logo ni visuel proprietaire n'est utilise, et aucun
 * combattant reel n'apparait dans le roster (section 140 : roster fictif
 * en attendant un import de donnees sous licence).
 *
 * Quatre paliers volontairement non-hierarchiques (section 39) : aucun
 * chemin n'est objectivement optimal, chacun a des forces differentes.
 */
export const ORGANIZATIONS: Organization[] = [
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

export function getOrganization(id: string): Organization {
  const org = ORGANIZATIONS.find((o) => o.id === id);
  if (!org) throw new Error(`Organisation inconnue: ${id}`);
  return org;
}
