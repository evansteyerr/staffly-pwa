import type { CareerState, ContractOffer } from "@/types";
import { Rng } from "@/game/rng/prng";
import { ORGANIZATIONS } from "@/data/organizations";
import { computeOverall } from "@/types";

/**
 * Genere des offres de contrat plausibles selon le niveau du combattant
 * (section 40). Aucun chemin unique optimal (section 39) : SFC = prestige
 * max mais paye au combat, GFL = garanti et bien paye, ACS = tremplin
 * accessible.
 */
export function generateContractOffers(state: CareerState, rng: Rng): ContractOffer[] {
  const { fighter } = state;
  const overall = computeOverall(fighter.attributes);
  const fightsPlayed = fighter.record.wins + fighter.record.losses;
  const winRate = fightsPlayed > 0 ? fighter.record.wins / fightsPlayed : 0.5;

  const strength = overall * 0.5 + fighter.popularity * 0.3 + winRate * 20 + fighter.reputation * 0.2;

  const offers: ContractOffer[] = [];
  for (const org of ORGANIZATIONS) {
    const eligibility = strength - org.recruitmentDifficulty;
    if (eligibility < -25 && org.tier !== "regional") continue;
    if (state.contract?.organizationId === org.id) continue;

    const tierMultiplier = org.tier === "elite" ? 3.2 : org.tier === "mid" ? 1.6 : 1;
    const baseShow = Math.max(400, Math.round((strength * 60 + rng.int(-300, 300)) * tierMultiplier));
    const baseWin = Math.round(baseShow * 0.9);
    const fights = org.contractStyle === "guaranteed" ? rng.int(3, 4) : rng.int(3, 5);

    offers.push({
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

  return offers.sort((a, b) => b.prestigeStars - a.prestigeStars);
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
