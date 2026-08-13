import type { Fighter, WorldState } from "@/types";
import { Rng } from "@/game/rng/prng";
import { estimateWinProbability } from "@/game/fight/simulate";
import { rebuildAllRankings } from "@/game/ranking/rankings";
import { generateNpcFighter, ageFromDob } from "@/game/fighter/generate";
import { NATIONALITIES } from "@/data/names";
import { WEIGHT_CLASSES } from "@/data/organizations/weightClasses";
import { REGIONAL_ORG_IDS, MID_ORG_IDS } from "@/data/organizations";
import { applyAgingTick } from "@/game/progression/aging";

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Simule le monde hors joueur en tache de fond (section F/123-124). Les
 * combats NPC vs NPC sont resolus par un jet unique pondere (pas de
 * simulation round par round) pour rester performant avec des centaines
 * de combattants.
 */
export function advanceWorld(world: WorldState, days: number, rng: Rng, excludeFighterId: string): WorldState {
  const newDate = addDays(world.currentDate, days);
  const fighters: Record<string, Fighter> = { ...world.fighters };
  const news = [...world.news];

  const npcIds = Object.keys(fighters).filter((id) => id !== excludeFighterId && !fighters[id].retired);

  // Combats NPC (echantillon, pas tous a chaque tick, pour la performance)
  const fightsToSimulate = Math.max(1, Math.round((days / 30) * Math.min(npcIds.length, 40) * 0.15));
  for (let i = 0; i < fightsToSimulate; i++) {
    if (npcIds.length < 2) break;
    const fighterA = fighters[rng.pick(npcIds)];
    const sameClass = npcIds.filter(
      (id) => fighters[id].weightClass === fighterA.weightClass && fighters[id].organizationId === fighterA.organizationId && id !== fighterA.id,
    );
    if (sameClass.length === 0) continue;
    const fighterB = fighters[rng.pick(sameClass)];

    const pAWin = estimateWinProbability(fighterA, fighterB);
    const aWins = rng.chance(pAWin);
    const winner = aWins ? fighterA : fighterB;
    const loser = aWins ? fighterB : fighterA;
    const finishRoll = rng.next();
    const isKo = finishRoll < 0.35;
    const isSub = !isKo && finishRoll < 0.55;

    fighters[winner.id] = {
      ...winner,
      record: {
        ...winner.record,
        wins: winner.record.wins + 1,
        winsByKo: winner.record.winsByKo + (isKo ? 1 : 0),
        winsBySub: winner.record.winsBySub + (isSub ? 1 : 0),
        winsByDec: winner.record.winsByDec + (!isKo && !isSub ? 1 : 0),
      },
      momentum: Math.min(100, winner.momentum + 12),
      popularity: Math.min(100, winner.popularity + rng.float(0.5, 2.5)),
      careerWear: Math.min(100, winner.careerWear + rng.float(1, 3)),
    };
    fighters[loser.id] = {
      ...loser,
      record: { ...loser.record, losses: loser.record.losses + 1 },
      momentum: Math.max(-100, loser.momentum - 15),
      careerWear: Math.min(100, loser.careerWear + rng.float(2, 5)),
    };

    if (fighterA.organizationId === "ufc" && rng.chance(0.15)) {
      news.push({
        id: `news-${newDate}-${winner.id}`,
        date: newDate,
        headline: `${winner.firstName} ${winner.lastName} l'emporte face a ${loser.firstName} ${loser.lastName}.`,
      });
    }
  }

  // Vieillissement + retraites + prospects
  for (const id of npcIds) {
    const f = fighters[id];
    const age = ageFromDob(f.dateOfBirth, newDate);
    fighters[id] = applyAgingTick(f, age, days, rng);

    const retirementChance = age > 38 ? 0.02 : age > 34 ? 0.006 : f.careerWear > 85 ? 0.01 : 0;
    if (retirementChance > 0 && rng.chance(retirementChance * (days / 30))) {
      fighters[id] = { ...fighters[id], retired: true };
      if (rng.chance(0.2)) {
        news.push({ id: `news-ret-${id}-${newDate}`, date: newDate, headline: `${f.firstName} ${f.lastName} annonce sa retraite.` });
      }
    }
  }

  // Generation de nouveaux prospects (section 9), rythme modeste
  const activeCount = Object.values(fighters).filter((f) => !f.retired).length;
  const prospectsToAdd = rng.chance(Math.min(0.9, days / 200)) ? rng.int(1, 3) : 0;
  for (let i = 0; i < prospectsToAdd; i++) {
    const wc = rng.pick(WEIGHT_CLASSES);
    const nat = rng.pick(NATIONALITIES);
    // Les nouveaux prospects ne doivent pas tous atterrir en regional
    // (bug identifie via sonde) : sans apport direct au palier mid, un
    // roster oktagon/ksw/pfl qui s'etiole par les retraites ne se
    // reconstitue jamais, et un combattant sous contrat peut se retrouver
    // sans aucun adversaire possible dans sa categorie pendant des annees.
    const orgRoll = rng.next();
    const organizationId = orgRoll > 0.85 ? rng.pick(MID_ORG_IDS) : orgRoll > 0.15 ? rng.pick(REGIONAL_ORG_IDS) : null;
    const prospect = generateNpcFighter(
      {
        nationalityCode: nat.code,
        gender: wc.gender,
        weightClassId: wc.id,
        quality: rng.int(40, 70),
        age: rng.int(18, 22),
        worldDate: newDate,
        organizationId,
      },
      rng,
    );
    fighters[prospect.id] = prospect;
  }
  if (activeCount < 20) {
    // filet de securite : garder un vivier minimal
  }

  let updatedWorld: WorldState = { ...world, currentDate: newDate, fighters, news: news.slice(-30) };
  updatedWorld = { ...updatedWorld, rankings: rebuildAllRankings(updatedWorld) };
  updatedWorld = {
    ...updatedWorld,
    titles: updatedWorld.titles.map((t) => {
      const board = updatedWorld.rankings.find((r) => r.organizationId === t.organizationId && r.weightClassId === t.weightClassId);
      if (board?.championId && board.championId !== t.currentChampionId) {
        news.push({
          id: `news-title-${t.id}-${newDate}`,
          date: newDate,
          headline: `${updatedWorld.fighters[board.championId]?.firstName ?? "Un combattant"} ${updatedWorld.fighters[board.championId]?.lastName ?? ""} devient champion !`,
        });
      }
      return { ...t, currentChampionId: board?.championId ?? t.currentChampionId };
    }),
  };

  return updatedWorld;
}
