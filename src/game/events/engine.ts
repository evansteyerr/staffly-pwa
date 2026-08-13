import type { CareerState, EffectBag, EventChoice, EventOutcome, EventTemplate } from "@/types";
import { Rng } from "@/game/rng/prng";
import { deriveCareerPhase } from "./phase";
import { getOrganization } from "@/data/organizations";
import { ageFromDob } from "@/game/fighter/generate";
import { renderTemplate } from "@/game/narrative/template";
import { ATTRIBUTE_KEYS } from "@/types";

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

export function isEventEligible(state: CareerState, event: EventTemplate): boolean {
  const { fighter } = state;
  const age = ageFromDob(fighter.dateOfBirth, state.worldDate);
  if (event.minAge !== undefined && age < event.minAge) return false;
  if (event.maxAge !== undefined && age > event.maxAge) return false;

  if (event.careerPhase && !event.careerPhase.includes(deriveCareerPhase(state))) return false;

  if (event.requiredOrganizationTier) {
    const org = fighter.organizationId ? getOrganization(fighter.organizationId) : null;
    if (!org || !event.requiredOrganizationTier.includes(org.tier)) return false;
  }

  if (event.requiredFlags && !event.requiredFlags.every((f) => state.flags.includes(f))) return false;
  if (event.forbiddenFlags && event.forbiddenFlags.some((f) => state.flags.includes(f))) return false;

  if (event.minPopularity !== undefined && fighter.popularity < event.minPopularity) return false;
  if (event.maxPopularity !== undefined && fighter.popularity > event.maxPopularity) return false;

  const history = state.eventHistory[event.id];
  if (history) {
    if (event.maxOccurrences !== undefined && history.count >= event.maxOccurrences) return false;
    const daysSince = (new Date(state.worldDate).getTime() - new Date(history.lastFiredOn).getTime()) / 86400000;
    if (daysSince < event.cooldownDays) return false;
  }

  return true;
}

export function getEligiblePool(state: CareerState, allEvents: EventTemplate[]): EventTemplate[] {
  return allEvents.filter((e) => isEventEligible(state, e));
}

export function pickNextEvent(state: CareerState, allEvents: EventTemplate[], rng: Rng): EventTemplate | null {
  const pool = getEligiblePool(state, allEvents);
  if (pool.length === 0) return null;
  return rng.weightedPick(pool, (e) => e.weight);
}

/**
 * Certains evenements (rivalite) referencent {opponentName} dans leur
 * texte. On resout un rival reel du monde genere : d'abord une relation
 * negative marquee (une vraie rivalite construite en jeu), sinon un
 * combattant plausible de la meme categorie — jamais un nom de personne
 * reelle (section 5/128 : pas de donnees inventees attribuees a de vraies
 * personnes).
 */
function pickOpponentNameForTemplate(state: CareerState, template: EventTemplate, rng: Rng): string | undefined {
  const needsOpponent = template.title.includes("{opponentName}") || template.description.includes("{opponentName}");
  if (!needsOpponent) return undefined;

  const rivalEntries = Object.entries(state.fighterRelationships).filter(([, value]) => value < -15);
  if (rivalEntries.length > 0) {
    rivalEntries.sort((a, b) => a[1] - b[1]);
    const rival = state.worldState.fighters[rivalEntries[0][0]];
    if (rival) return `${rival.firstName} ${rival.lastName}`;
  }

  const pool = Object.values(state.worldState.fighters).filter(
    (f) =>
      f.id !== state.fighter.id &&
      f.weightClass === state.fighter.weightClass &&
      !f.retired &&
      (state.fighter.organizationId ? f.organizationId === state.fighter.organizationId : true),
  );
  if (pool.length === 0) return undefined;
  const pick = rng.pick(pool);
  return `${pick.firstName} ${pick.lastName}`;
}

export function activateEvent(state: CareerState, template: EventTemplate, rng: Rng): CareerState {
  const opponentName = pickOpponentNameForTemplate(state, template, rng);
  const extra = opponentName ? { opponentName } : undefined;
  return {
    ...state,
    activeEvent: {
      template,
      renderedTitle: renderTemplate(template.title, state, extra),
      renderedDescription: renderTemplate(template.description, state, extra),
    },
  };
}

function applyEffects(state: CareerState, effects: Partial<EffectBag>): CareerState {
  const fighter = { ...state.fighter };
  fighter.form = clamp(fighter.form + (effects.form ?? 0));
  fighter.morale = clamp(fighter.morale + (effects.morale ?? 0));
  fighter.confidence = clamp(fighter.confidence + (effects.confidence ?? 0));
  fighter.reputation = clamp(fighter.reputation + (effects.reputation ?? 0));
  fighter.popularity = clamp(fighter.popularity + (effects.popularity ?? 0));
  fighter.momentum = clamp(fighter.momentum + (effects.momentum ?? 0), -100, 100);
  fighter.careerWear = clamp(fighter.careerWear + (effects.careerWear ?? 0));

  if (effects.attributeBoost && ATTRIBUTE_KEYS.includes(effects.attributeBoost.key as never)) {
    const key = effects.attributeBoost.key as keyof typeof fighter.attributes;
    fighter.attributes = {
      ...fighter.attributes,
      [key]: clamp(fighter.attributes[key] + effects.attributeBoost.amount, 1, 99),
    };
  }

  const narrative = { ...state.narrative };
  narrative.hunger = clamp(narrative.hunger + (effects.hunger ?? 0));
  narrative.ego = clamp(narrative.ego + (effects.ego ?? 0));
  narrative.stress = clamp(narrative.stress + (effects.stress ?? 0));
  narrative.mediaPressure = clamp(narrative.mediaPressure + (effects.mediaPressure ?? 0));
  narrative.coachTrust = clamp(narrative.coachTrust + (effects.coachTrust ?? 0));
  narrative.promoterTrust = clamp(narrative.promoterTrust + (effects.promoterTrust ?? 0));
  narrative.financialSecurity = clamp(narrative.financialSecurity + (effects.financialSecurity ?? 0));

  const relationships = { ...state.relationships };
  relationships.coach = clamp((relationships.coach ?? 0) + (effects.relationshipCoach ?? 0), -100, 100);
  relationships.manager = clamp((relationships.manager ?? 0) + (effects.relationshipManager ?? 0), -100, 100);
  relationships.gym = clamp((relationships.gym ?? 0) + (effects.relationshipGym ?? 0), -100, 100);
  relationships.promoter = clamp((relationships.promoter ?? 0) + (effects.relationshipPromoter ?? 0), -100, 100);

  const finances = {
    ...state.finances,
    careerEarnings: state.finances.careerEarnings + Math.max(0, effects.money ?? 0),
    netWorth: state.finances.netWorth + (effects.money ?? 0),
  };

  return { ...state, fighter, narrative, relationships, finances };
}

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Multiplicateur global du temps qui passe entre deux evenements
 * (section 3) : une carriere complete doit tenir en ~10 minutes de jeu,
 * donc chaque decision doit couvrir plusieurs mois de temps in-fiction
 * plutot que quelques jours. Un seul reglage ici plutot que de retoucher
 * chaque duree dans chaque fichier de contenu.
 */
const EVENT_TIME_SCALE = 19;

export function applyChoice(state: CareerState, choice: EventChoice, rng: Rng): CareerState {
  const template = state.activeEvent!.template;
  const renderedTitle = state.activeEvent!.renderedTitle;

  let effects: Partial<EffectBag> = choice.visibleEffects;
  let success: boolean | null = null;
  if (choice.successChance !== undefined) {
    success = rng.chance(choice.successChance);
    effects = success ? choice.visibleEffects : (choice.onFailure ?? {});
  }

  let next = applyEffects(state, effects);
  if (choice.hiddenEffects) next = applyEffects(next, choice.hiddenEffects);

  const flags = new Set(next.flags);
  choice.setFlags?.forEach((f) => flags.add(f));
  choice.removeFlags?.forEach((f) => flags.delete(f));

  const timeAdvance = rng.int(choice.timeAdvanceDaysMin, choice.timeAdvanceDaysMax) * EVENT_TIME_SCALE;
  const worldDate = addDays(next.worldDate, timeAdvance);

  const pendingFollowUps = [...next.pendingFollowUps];
  choice.followUps?.forEach((fu) => {
    pendingFollowUps.push({
      eventId: fu.eventId,
      fireOn: addDays(worldDate, rng.int(fu.delayDaysMin, fu.delayDaysMax)),
    });
  });

  const eventHistory = {
    ...next.eventHistory,
    [template.id]: {
      lastFiredOn: worldDate,
      count: (next.eventHistory[template.id]?.count ?? 0) + 1,
    },
  };

  const resultLabel =
    success === null
      ? (choice.flavor ?? "Decision prise.")
      : success
        ? (choice.successLabel ?? "Ca a fonctionne comme prevu.")
        : (choice.failureLabel ?? "Ca ne s'est pas passe comme prevu.");

  const outcome: EventOutcome = {
    eventTitle: renderedTitle,
    choiceLabel: choice.label,
    resultLabel,
    success,
    effects,
  };

  return {
    ...next,
    flags: Array.from(flags),
    worldDate,
    pendingFollowUps,
    eventHistory,
    activeEvent: null,
    lastEventOutcome: outcome,
  };
}
