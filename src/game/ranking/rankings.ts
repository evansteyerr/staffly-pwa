import type { Fighter, Organization, RankingBoard, WeightClass, WorldState } from "@/types";

/**
 * Score de classement (section 45) : qualite des victoires + activite +
 * finish rate + momentum + ancien classement, popularite = facteur mineur.
 */
export function computeRankScore(fighter: Fighter): number {
  const winRate = fighter.record.wins + fighter.record.losses > 0
    ? fighter.record.wins / (fighter.record.wins + fighter.record.losses)
    : 0.4;
  const finishRate = fighter.record.wins > 0
    ? (fighter.record.winsByKo + fighter.record.winsBySub) / fighter.record.wins
    : 0;
  const activity = Math.min(fighter.record.wins + fighter.record.losses, 20);

  const skill = fighter.attributes.fightIQ * 0.3 +
    (fighter.attributes.striking + fighter.attributes.wrestling + fighter.attributes.bjj) / 3 * 0.4;

  return (
    winRate * 45 +
    finishRate * 15 +
    activity * 1.2 +
    fighter.momentum * 0.15 +
    skill * 0.3 +
    fighter.popularity * 0.05
  );
}

export function rebuildRankingBoard(
  organization: Organization,
  weightClass: WeightClass,
  fighters: Fighter[],
  previousChampionId: string | null,
): RankingBoard {
  const roster = fighters.filter(
    (f) => f.organizationId === organization.id && f.weightClass === weightClass.id && !f.retired,
  );
  const scored = roster
    .map((f) => ({ fighterId: f.id, score: computeRankScore(f) }))
    .sort((a, b) => b.score - a.score);

  let championId = previousChampionId;
  if (!championId || !scored.some((s) => s.fighterId === championId)) {
    championId = scored[0]?.fighterId ?? null;
  }

  const top15 = scored.filter((s) => s.fighterId !== championId).slice(0, 15);

  return {
    organizationId: organization.id,
    weightClassId: weightClass.id,
    championId,
    top15,
  };
}

export function rebuildAllRankings(world: WorldState): RankingBoard[] {
  const fighters = Object.values(world.fighters);
  const boards: RankingBoard[] = [];
  for (const org of world.organizations) {
    for (const wcId of org.weightClasses) {
      const wc = world.weightClasses.find((w) => w.id === wcId);
      if (!wc) continue;
      const prev = world.rankings.find((r) => r.organizationId === org.id && r.weightClassId === wcId);
      boards.push(rebuildRankingBoard(org, wc, fighters, prev?.championId ?? null));
    }
  }
  return boards;
}

export function getRankPosition(world: WorldState, fighter: Fighter): number | "champion" | null {
  const board = world.rankings.find(
    (r) => r.organizationId === fighter.organizationId && r.weightClassId === fighter.weightClass,
  );
  if (!board) return null;
  if (board.championId === fighter.id) return "champion";
  const idx = board.top15.findIndex((e) => e.fighterId === fighter.id);
  return idx === -1 ? null : idx + 1;
}
