import type { Fighter, Organization, Title, WorldState } from "@/types";
import { Rng } from "@/game/rng/prng";
import { ORGANIZATIONS, REGIONAL_ORG_IDS, MID_ORG_IDS } from "@/data/organizations";
import { WEIGHT_CLASSES } from "@/data/organizations/weightClasses";
import { NATIONALITIES } from "@/data/names";
import { generateNpcFighter } from "@/game/fighter/generate";
import { rebuildAllRankings } from "@/game/ranking/rankings";
import { convertRealRoster } from "@/game/fighter/importRealFighter";
import { REAL_UFC_ROSTER } from "@/data/fighters/realRoster";

// Assez de combattants par categorie pour offrir un vrai bassin
// d'adversaires coherents (gatekeepers, milieu de classement, contenders)
// plutot qu'une poignee de noms ou tout le monde finit "classe" d'office.
// Releve pour repartir sur 7 organisations sans que chacune ne se
// retrouve avec un roster trop clairseme.
const FIGHTERS_PER_WEIGHT_CLASS = 64;

/**
 * Cree un snapshot initial du monde (section 7/122) : le vrai roster n'est
 * pas encore branche (section 140) — pour le MVP, un roster fictif est
 * genere de facon deterministe a partir de la seed de la carriere, reparti
 * sur les organisations (reelles de nom, roster simule — voir
 * data/organizations) par paliers de qualite.
 */
export function generateWorld(seed: string, databaseVersion: string, startDate: string): WorldState {
  const rng = Rng.fromString(`world:${seed}`);
  const fighters: Record<string, Fighter> = {};

  for (const wc of WEIGHT_CLASSES) {
    for (let i = 0; i < FIGHTERS_PER_WEIGHT_CLASS; i++) {
      const nat = rng.pick(NATIONALITIES);
      const age = rng.int(20, 37);
      // Distribution de qualite : quelques elites, beaucoup de gatekeepers,
      // repartis sur les 3 paliers (regional / confirme / elite).
      const qualityRoll = rng.next();
      let quality: number;
      let orgId: string | null;
      if (qualityRoll > 0.95) {
        quality = rng.int(82, 96);
        orgId = "ufc";
      } else if (qualityRoll > 0.85) {
        quality = rng.int(70, 86);
        orgId = rng.chance(0.55) ? "ufc" : rng.pick(MID_ORG_IDS);
      } else if (qualityRoll > 0.65) {
        quality = rng.int(58, 74);
        orgId = rng.pick(MID_ORG_IDS);
      } else if (qualityRoll > 0.45) {
        quality = rng.int(48, 64);
        orgId = rng.chance(0.5) ? rng.pick(MID_ORG_IDS) : rng.pick(REGIONAL_ORG_IDS);
      } else if (qualityRoll > 0.2) {
        quality = rng.int(38, 55);
        orgId = rng.pick(REGIONAL_ORG_IDS);
      } else {
        quality = rng.int(30, 48);
        orgId = rng.pick(REGIONAL_ORG_IDS);
      }

      const fighter = generateNpcFighter(
        {
          nationalityCode: nat.code,
          gender: wc.gender,
          weightClassId: wc.id,
          quality,
          age,
          worldDate: startDate,
          organizationId: orgId,
        },
        rng,
      );
      fighters[fighter.id] = fighter;
    }
  }

  // Roster reel (section 5/122) : injecte a cote du roster simule des que
  // des entrees valides existent dans data/fighters/realRoster.ts.
  for (const realFighter of convertRealRoster(REAL_UFC_ROSTER, seed, startDate)) {
    fighters[realFighter.id] = realFighter;
  }

  const organizations: Organization[] = ORGANIZATIONS;
  const titles: Title[] = organizations.flatMap((org) =>
    org.weightClasses.map((wcId) => ({
      id: `title-${org.id}-${wcId}`,
      organizationId: org.id,
      weightClassId: wcId,
      label: `Championnat ${org.shortName} — ${WEIGHT_CLASSES.find((w) => w.id === wcId)?.label ?? wcId}`,
      currentChampionId: null,
      interim: false,
    })),
  );

  let world: WorldState = {
    databaseVersion,
    currentDate: startDate,
    organizations,
    weightClasses: WEIGHT_CLASSES,
    titles,
    fighters,
    rankings: [],
    news: [
      { id: "news-0", date: startDate, headline: "Une nouvelle generation de combattants se prepare a ecrire son histoire." },
    ],
    recentFights: [],
  };

  world = { ...world, rankings: rebuildAllRankings(world) };
  world = {
    ...world,
    titles: world.titles.map((t) => {
      const board = world.rankings.find((r) => r.organizationId === t.organizationId && r.weightClassId === t.weightClassId);
      return { ...t, currentChampionId: board?.championId ?? null };
    }),
  };

  return world;
}
