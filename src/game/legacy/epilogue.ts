import type { CareerState } from "@/types";
import { Rng } from "@/game/rng/prng";
import type { LegacyClassInfo } from "./score";

/** Section 76 — jamais la meme phrase deux fois : assemblage par fragments piochés. */
const OPENERS: Record<string, string[]> = {
  journeyman: ["Tu n'as jamais brille sous les projecteurs.", "Ton nom ne figurera dans aucun livre d'histoire.", "Le succes t'a echappe la plupart du temps."],
  regional_fighter: ["Tu es reste un nom respecte du circuit regional.", "Les grandes scenes ne t'ont jamais vraiment ouvert leurs portes."],
  recognized_pro: ["Tu as construit une carriere solide, sans jamais exploser.", "Ton parcours restera celui d'un professionnel serieux et regulier."],
  contender: ["Tu as frappe a la porte de l'elite, sans jamais vraiment l'enfoncer.", "Beaucoup t'ont vu comme une menace credible, sans plus."],
  elite_fighter: ["Tu as fait partie des meilleurs de ta generation.", "Peu de combattants pouvaient se targuer d'un tel niveau."],
  champion: ["Tu es devenu champion, et ce titre restera a jamais le tien.", "Peu importe la suite : tu as regne, ne serait-ce qu'un temps."],
  superstar: ["Tu es devenu bien plus qu'un combattant : une vraie star.", "Ton nom depassait largement les frontieres du sport."],
  legend: ["Ton nom restera grave dans l'histoire de ce sport.", "Peu de carrieres ont marque les esprits comme la tienne."],
  goat_territory: ["Certains n'hesitent plus a prononcer le mot GOAT en parlant de toi.", "Ta carriere a redefini ce qu'on pensait possible dans ce sport."],
};

const MIDDLES = [
  "Apres {fights} combats professionnels et {orgs} organisations traversees,",
  "En {years} ans de carriere,",
  "Avec un bilan de {record},",
  "Malgre {losses} defaites sur le parcours,",
];

const CLOSERS = [
  "personne ne pourra dire que tu n'as pas essaye.",
  "ton histoire restera unique, comme toutes les autres.",
  "tu as ecrit ta propre legende, a ta maniere.",
  "le prochain chapitre appartient a quelqu'un d'autre desormais.",
];

export function generateEpilogue(state: CareerState, legacyClass: LegacyClassInfo, rng: Rng): string {
  const openerPool = OPENERS[legacyClass.id] ?? OPENERS.journeyman;
  const opener = rng.pick(openerPool);
  const middleTemplate = rng.pick(MIDDLES);
  const closer = rng.pick(CLOSERS);

  const fights = state.fighter.record.wins + state.fighter.record.losses + state.fighter.record.draws;
  const orgsVisited = new Set(state.fightHistory.map((f) => f.fight.organizationId)).size;
  const years = new Date(state.worldDate).getFullYear() - new Date(state.fighter.dateOfBirth).getFullYear() - 18;

  const middle = middleTemplate
    .replace("{fights}", String(fights))
    .replace("{orgs}", String(Math.max(1, orgsVisited)))
    .replace("{years}", String(Math.max(1, years)))
    .replace("{record}", `${state.fighter.record.wins}-${state.fighter.record.losses}-${state.fighter.record.draws}`)
    .replace("{losses}", String(state.fighter.record.losses));

  return `${opener} ${middle} ${closer}`;
}
