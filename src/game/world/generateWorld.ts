import type { Fighter, Organization, Title, WorldState } from "@/types";
import { Rng } from "@/game/rng/prng";
import { ORGANIZATIONS } from "@/data/organizations";
import { WEIGHT_CLASSES } from "@/data/organizations/weightClasses";
import { NATIONALITIES } from "@/data/names";
import { generateNpcFighter } from "@/game/fighter/generate";
import { rebuildAllRankings } from "@/game/ranking/rankings";

// Assez de combattants par categorie pour offrir un vrai bassin
// d'adversaires coherents (gatekeepers, milieu de classement, contenders)
// plutot qu'une poignee de noms ou tout le monde finit "classe" d'office.
const FIGHTERS_PER_WEIGHT_CLASS = 26;

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
      // Distribution de qualite : quelques elites, beaucoup de gatekeepers.
      const qualityRoll = rng.next();
      let quality: number;
      let orgId: string | null;
      if (qualityRoll > 0.93) {
        quality = rng.int(82, 96);
        orgId = "ufc";
      } else if (qualityRoll > 0.78) {
        quality = rng.int(68, 84);
        orgId = rng.chance(0.6) ? "ufc" : "pfl";
      } else if (qualityRoll > 0.55) {
        quality = rng.int(58, 72);
        orgId = rng.chance(0.6) ? "pfl" : "ksw";
      } else if (qualityRoll > 0.3) {
        quality = rng.int(45, 62);
        // La tranche "confirmee" va surtout en KSW : Cage Warriors reste un
        // vrai tremplin d'entree, pas un gatekeeper systematique pour un debutant.
        orgId = rng.chance(0.65) ? "ksw" : "cw";
      } else {
        quality = rng.int(35, 55);
        orgId = "cw";
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
