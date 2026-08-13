import type { RealFighterRecord } from "./realRosterSchema";

/**
 * ROSTER UFC REEL — a remplir.
 *
 * Cette liste est volontairement vide. Le moteur ne genere jamais de
 * donnees factuelles (nom, classement, palmares) pour de vrais
 * combattants a partir de simples suppositions (section 5/127 du cahier
 * des charges) : cette information doit venir de toi ou d'une source dont
 * l'usage est approprie.
 *
 * Pour ajouter des combattants reels, ajoute des entrees au tableau
 * ci-dessous avec ce format (voir realRosterSchema.ts pour le detail) :
 *
 * {
 *   firstName: "Islam",
 *   lastName: "Makhachev",
 *   nickname: "",                  // optionnel
 *   gender: "male",
 *   nationality: "Russie",         // nom en clair, voir data/names pour les pays geres
 *   weightClass: "Lightweight",    // nom en clair, resolu automatiquement
 *   organizationId: "ufc",
 *   record: { wins: 26, losses: 1, draws: 0 },
 *   ranking: "champion",           // 1-15, "champion", ou null si inconnu/non classe
 *   dateOfBirth: null,             // "YYYY-MM-DD" si connue, sinon null (jamais invente)
 *   height: null,                  // en cm si connu, sinon null
 *   reach: null,                   // en cm si connu, sinon null
 *   source: "a completer",         // d'ou vient cette donnee (obligatoire)
 *   lastVerifiedAt: "2026-08-13",  // date a laquelle tu as verifie cette info
 * }
 *
 * Seuls les champs marques "obligatoire" dans realRosterSchema.ts sont
 * requis ; le reste peut rester `null`/omis si tu ne le connais pas — le
 * moteur ne comblera jamais un vide par une fausse precision.
 *
 * Une fois des entrees ajoutees ici, elles sont automatiquement injectees
 * dans le monde du jeu au demarrage d'une carriere (voir
 * game/world/generateWorld.ts), aux cotes du reste du roster simule.
 */
export const REAL_UFC_ROSTER: RealFighterRecord[] = [];
