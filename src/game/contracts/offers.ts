import type { CareerState, ContractOffer, OrgTier } from "@/types";
import { Rng } from "@/game/rng/prng";
import { ORGANIZATIONS, getOrganization } from "@/data/organizations";
import { computeOverall } from "@/types";

const TIER_RANK: Record<OrgTier, number> = { regional: 0, mid: 1, elite: 2 };

/** Plus haut palier jamais atteint (contrat actuel ou combats passes) — on ne redescend plus jamais en dessous une fois monte (section demandee). */
function highestTierReached(state: CareerState): number {
  let best = -1;
  if (state.fighter.organizationId) {
    best = Math.max(best, TIER_RANK[getOrganization(state.fighter.organizationId).tier]);
  }
  for (const record of state.fightHistory) {
    best = Math.max(best, TIER_RANK[getOrganization(record.fight.organizationId).tier]);
  }
  return best;
}

/**
 * Genere des offres de contrat plausibles selon le niveau du combattant
 * (section 40). Aucun chemin unique optimal (section 39). Seules quelques
 * organisations demarchent a la fois (jamais les 7 d'un coup — section
 * demandee), et une fois un palier superieur atteint, les organisations
 * plus petites arretent de proposer des contrats.
 */
export function generateContractOffers(state: CareerState, rng: Rng): ContractOffer[] {
  const { fighter } = state;
  const overall = computeOverall(fighter.attributes);
  const fightsPlayed = fighter.record.wins + fighter.record.losses;
  const winRate = fightsPlayed > 0 ? fighter.record.wins / fightsPlayed : 0.5;
  const totalFights = fighter.record.wins + fighter.record.losses + fighter.record.draws;

  const strength = overall * 0.5 + fighter.popularity * 0.3 + winRate * 20 + fighter.reputation * 0.2;
  // Les cachets grimpent avec l'experience, pas seulement avec le niveau
  // brut du moment (section demandee) : un veteran de 20 combats gagne
  // nettement plus qu'un debutant au meme "strength" instantane.
  const experienceMultiplier = 1 + Math.min(1.6, totalFights * 0.045);

  const minTierRank = highestTierReached(state);

  const eligible: ContractOffer[] = [];
  for (const org of ORGANIZATIONS) {
    if (TIER_RANK[org.tier] < minTierRank) continue; // plus de petites organisations une fois monte
    const eligibility = strength - org.recruitmentDifficulty;
    // Un debutant sans palmares doit d'abord faire ses preuves en regional
    // (section 39/99) : les paliers mid/elite se meritent avec des victoires,
    // de la popularite et de la reputation, pas juste un profil correct.
    const minEligibility = org.tier === "elite" ? 20 : org.tier === "mid" ? 0 : -Infinity;
    if (eligibility < minEligibility) continue;
    if (state.contract?.organizationId === org.id) continue;

    const tierMultiplier = org.tier === "elite" ? 3.2 : org.tier === "mid" ? 1.6 : 1;
    const baseShow = Math.max(400, Math.round((strength * 60 + rng.int(-300, 300)) * tierMultiplier * experienceMultiplier));
    const baseWin = Math.round(baseShow * 0.9);
    const fights = org.contractStyle === "guaranteed" ? rng.int(3, 4) : rng.int(3, 5);

    eligible.push({
      id: `offer-${org.id}-${state.worldDate}-${rng.int(0, 999999)}`,
      organizationId: org.id,
      fights,
      showMoney: baseShow,
      winBonus: baseWin,
      guaranteed: org.contractStyle === "guaranteed" ? baseShow * fights : undefined,
      prestigeStars: Math.max(1, Math.round(org.prestige / 20)),
      oppositionStars: Math.max(1, Math.round(org.rosterQuality / 20)),
    });
  }

  if (eligible.length === 0) return [];

  // Seules quelques organisations demarchent en meme temps (1 a 3), jamais
  // toutes celles eligibles a la fois — plus credible qu'un demarchage
  // simultane de 7 promotions.
  const shuffled = [...eligible];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const count = Math.min(shuffled.length, rng.int(1, 3));
  const selected = shuffled.slice(0, count);

  return selected.sort((a, b) => b.prestigeStars - a.prestigeStars);
}

export function negotiateOffer(offer: ContractOffer, rng: Rng, leverage: number): { success: boolean; offer: ContractOffer } {
  const successChance = 0.35 + leverage * 0.3;
  if (rng.chance(successChance)) {
    return {
      success: true,
      offer: { ...offer, showMoney: Math.round(offer.showMoney * 1.2), winBonus: Math.round(offer.winBonus * 1.2) },
    };
  }
  return { success: false, offer };
}
