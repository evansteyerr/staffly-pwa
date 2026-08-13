import type {
  CampFocus,
  CareerCreationChoices,
  CareerState,
  ContractOffer,
  EventTemplate,
  Fighter,
  Gameplan,
} from "@/types";
import { Rng } from "@/game/rng/prng";
import { generatePlayerFighter, ageFromDob } from "@/game/fighter/generate";
import type { PlayerCreationInput } from "@/game/fighter/generate";
import { generateWorld } from "@/game/world/generateWorld";
import { advanceWorld } from "@/game/world/tick";
import { applyAgingTick } from "@/game/progression/aging";
import { generateContractOffers } from "@/game/contracts/offers";
import { activateEvent, applyChoice, pickNextEvent } from "@/game/events/engine";
import { ALL_EVENTS } from "@/data/events";
import { simulateFight, applyCampFocusBoost } from "@/game/fight/simulate";
import { computeLegacy, classifyLegacy } from "@/game/legacy/score";
import { generateEpilogue } from "@/game/legacy/epilogue";
import { getOrganization } from "@/data/organizations";
import { getRankPosition, rebuildAllRankings } from "@/game/ranking/rankings";
import type { CareerMoment } from "@/types";
import { computeOverall } from "@/types";
import { getOrigin } from "@/data/creation/origins";
import { getEntourage } from "@/data/creation/entourages";

const DATABASE_VERSION = "2026-08-fictional";
const START_DATE = "2026-01-01";

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function pushRng(state: CareerState, rng: Rng): CareerState {
  return { ...state, rngState: rng.getState() };
}

function getRng(state: CareerState): Rng {
  return Rng.fromState(state.rngState);
}

function syncPlayerIntoWorld(state: CareerState): CareerState {
  const worldState = {
    ...state.worldState,
    fighters: { ...state.worldState.fighters, [state.fighter.id]: state.fighter },
  };
  return { ...state, worldState };
}

function addMoment(state: CareerState, moment: Omit<CareerMoment, "id" | "date">): CareerState {
  const careerHistory = [
    ...state.careerHistory,
    { ...moment, id: `moment-${state.careerHistory.length}-${moment.kind}`, date: state.worldDate },
  ];
  return { ...state, careerHistory };
}

export interface NewCareerInput {
  seed: string;
  firstName: string;
  lastName: string;
  gender: "male" | "female";
  nationalityCode: string;
  weightClassId: string;
  birthYearsAgo: number; // age de depart, ex 18-22
  creationChoices: CareerCreationChoices;
}

export function createCareer(input: NewCareerInput): CareerState {
  const rng = Rng.fromString(input.seed);
  const dateOfBirth = `${new Date(START_DATE).getFullYear() - input.birthYearsAgo}-06-15`;

  const playerInput: PlayerCreationInput = {
    firstName: input.firstName,
    lastName: input.lastName,
    gender: input.gender,
    nationalityCode: input.nationalityCode,
    weightClassId: input.weightClassId,
    styleId: input.creationChoices.styleId,
    originId: input.creationChoices.originId,
    dateOfBirth,
  };

  const fighter = generatePlayerFighter(playerInput, rng);
  const world = generateWorld(input.seed, DATABASE_VERSION, START_DATE);

  const origin = getOrigin(input.creationChoices.originId);
  const entourage = getEntourage(input.creationChoices.entourageId);

  let state: CareerState = {
    careerId: `career-${input.seed}`,
    seed: input.seed,
    databaseVersion: DATABASE_VERSION,
    worldDate: START_DATE,
    fighter,
    creationChoices: input.creationChoices,
    contract: null,
    pendingOffers: [],
    relationships: { coach: 30, manager: entourage.startingRelationships.manager, gym: entourage.startingRelationships.gym, promoter: 0 },
    fighterRelationships: {},
    flags: [...origin.startingFlags],
    activeEvent: null,
    pendingFollowUps: [],
    eventHistory: {},
    fightHistory: [],
    careerHistory: [],
    titles: [],
    awards: [],
    finances: { careerEarnings: 0, netWorth: origin.startingMoney },
    narrative: { hunger: 50, ego: 40, stress: 20, mediaPressure: 10, coachTrust: 50, promoterTrust: 30, financialSecurity: 50 },
    worldState: world,
    rngState: rng.getState(),
    retired: false,
    ticksSinceLastFight: 0,
    pendingFight: null,
    lastFightResult: null,
  };

  state = syncPlayerIntoWorld(state);
  return addMoment(state, { label: "Debut du reve", detail: "Une nouvelle carriere commence.", kind: "debut" });
}

/** Age au-dela duquel la carriere s'arrete obligatoirement (section demandee : fin vers 38, jamais au-dela de 40). */
const HARD_RETIREMENT_AGE = 40;

/**
 * Un seul choix peut faire avancer le temps de plusieurs mois d'un coup
 * (EVENT_TIME_SCALE) : sans ce filet, un combattant a 39 ans et demi
 * pourrait "sauter" a 41-42 ans en un clic, passant au travers du
 * controle fait en debut de tick. On recadre donc la date exacte sur le
 * jour du 40e anniversaire avant de finaliser, pour que la limite soit
 * toujours respectee a l'annee pres.
 */
function enforceHardRetirementAge(state: CareerState, rng: Rng): CareerState {
  if (state.retired) return state;
  const age = ageFromDob(state.fighter.dateOfBirth, state.worldDate);
  if (age < HARD_RETIREMENT_AGE) return state;

  const dob = new Date(state.fighter.dateOfBirth);
  const cappedDate = new Date(dob.getFullYear() + HARD_RETIREMENT_AGE, dob.getMonth(), dob.getDate());
  const cappedDateStr = cappedDate.toISOString().slice(0, 10);

  return finalizeRetirement({ ...state, worldDate: cappedDateStr }, rng);
}

function retirementCheckProbability(age: number, wear: number): number {
  if (age < 31) return 0;
  // Rampe plus marquee : quasi certain d'avoir propose la retraite avant
  // 38 ans, le cap dur a 40 ans n'etant qu'un filet de securite.
  const ageFactor = (age - 31) * 0.11;
  const wearFactor = wear > 50 ? (wear - 50) * 0.018 : 0;
  return Math.min(0.85, ageFactor + wearFactor);
}

function buildRetirementEvent(): EventTemplate {
  return {
    id: "retirement_prompt",
    category: "retirement",
    title: "Une decision s'impose",
    description: "{fighterName}, {age} ans. Ton contrat et ton corps te posent la meme question : combien de temps encore ?",
    weight: 1,
    cooldownDays: 0,
    choices: [
      {
        id: "one_last_run",
        label: "Tenter un dernier run",
        flavor: "« La chance d'une vie ne se refuse pas. »",
        visibleEffects: { confidence: 5, careerWear: 4 },
        timeAdvanceDaysMin: 14,
        timeAdvanceDaysMax: 30,
      },
      {
        id: "retire_on_top",
        label: "Prendre ta retraite maintenant",
        flavor: "« Partir la tete haute, au bon moment. »",
        visibleEffects: {},
        setFlags: ["career_retire_now"],
        timeAdvanceDaysMin: 1,
        timeAdvanceDaysMax: 3,
      },
      {
        id: "sign_elsewhere",
        label: "Chercher un nouveau depart ailleurs",
        flavor: "« Mon histoire n'est pas encore finie. »",
        visibleEffects: { morale: 6 },
        setFlags: ["seeking_new_organization"],
        timeAdvanceDaysMin: 14,
        timeAdvanceDaysMax: 21,
      },
    ],
  };
}

function totalFights(f: Fighter): number {
  return f.record.wins + f.record.losses + f.record.draws;
}

/**
 * Meme classe #1-3, un combat de titre doit se meriter par un vrai
 * parcours (section 44/99) — sinon un petit vivier de debut permet un
 * title shot beaucoup trop tot dans la carriere.
 */
const MIN_FIGHTS_FOR_TITLE_SHOT = 8;

/**
 * Minimum de jours entre deux combats (avant camp) : garde un rythme
 * plausible (pas plus de ~3-4 combats par an une fois le camp de 21-42
 * jours ajoute), tout en laissant assez de place pour atteindre un vrai
 * palmares de fin de carriere (25-30 combats, section demandee) sur une
 * fenetre active de 15-20 ans.
 */
const MIN_DAYS_BETWEEN_FIGHTS = 60;

/**
 * Prime "Fight/Performance of the Night" (section demandee) : le budget
 * depend du palier de l'organisation — pas le meme montant chez ARES
 * (regional) et a l'UFC (elite).
 */
const BONUS_PAYOUT_RANGE_BY_TIER: Record<string, [number, number]> = {
  regional: [7000, 13000],
  mid: [20000, 35000],
  elite: [45000, 55000],
};

function computeBonusPayout(organizationId: string, bonusAwards: string[], rng: Rng): number {
  if (bonusAwards.length === 0) return 0;
  const org = getOrganization(organizationId);
  const [min, max] = BONUS_PAYOUT_RANGE_BY_TIER[org.tier];
  return Math.round(rng.float(min, max));
}

function pickOpponent(state: CareerState, rng: Rng): Fighter | null {
  const candidates = Object.values(state.worldState.fighters).filter(
    (f) =>
      f.id !== state.fighter.id &&
      f.organizationId === state.fighter.organizationId &&
      f.weightClass === state.fighter.weightClass &&
      !f.retired,
  );
  if (candidates.length === 0) return null;

  const playerRank = getRankPosition(state.worldState, state.fighter);
  const board = state.worldState.rankings.find(
    (r) => r.organizationId === state.fighter.organizationId && r.weightClassId === state.fighter.weightClass,
  );

  if (playerRank === "champion") {
    // Defense de titre : adversaire dans le haut du classement uniquement.
    const topIds = board?.top15.slice(0, 5).map((e) => e.fighterId) ?? [];
    const pool = candidates.filter((c) => topIds.includes(c.id));
    if (pool.length > 0) return rng.pick(pool);
  }
  if (
    typeof playerRank === "number" &&
    playerRank <= 3 &&
    totalFights(state.fighter) >= MIN_FIGHTS_FOR_TITLE_SHOT &&
    rng.chance(0.4)
  ) {
    if (board?.championId) {
      const champion = state.worldState.fighters[board.championId];
      if (champion) return champion;
    }
  }

  // Un combattant non classe (ou loin dans le classement) ne doit jamais
  // se voir proposer le champion ou le top 3 directement (section 99) :
  // on grimpe les echelons, on ne saute pas dessus. On exclut donc le
  // sommet du classement tant que ce n'est pas mérité.
  let pool = candidates;
  if (playerRank === null || (typeof playerRank === "number" && playerRank > 5)) {
    const protectedIds = new Set(
      [board?.championId, ...(board?.top15.slice(0, 3).map((e) => e.fighterId) ?? [])].filter(
        (id): id is string => !!id,
      ),
    );
    const filtered = candidates.filter((c) => !protectedIds.has(c.id));
    if (filtered.length > 0) pool = filtered;
  }

  // Matchmaking coherent (section 99/136) : combattants de niveau ET
  // d'experience proches — pas de 4-0 envoye contre un 17-5. On favorise
  // les adversaires proches sans exclure totalement les ecarts (permet un
  // "short notice" difficile ou une bonne surprise), mais fortement.
  const playerOverall = computeOverall(state.fighter.attributes);
  const playerFights = totalFights(state.fighter);
  const playerRankNum = typeof playerRank === "number" ? playerRank : playerRank === "champion" ? 0 : null;

  return rng.weightedPick(pool, (c) => {
    const skillDiff = Math.abs(computeOverall(c.attributes) - playerOverall);
    const experienceDiff = Math.abs(totalFights(c) - playerFights);
    const skillWeight = Math.exp(-skillDiff / 13);
    const experienceWeight = Math.exp(-experienceDiff / 2.5);

    // Une fois classe, on affronte des adversaires de classement proche
    // (ex : #10 affronte plutot des #7-13 qu'un inconnu du bas de tableau).
    let rankWeight = 1;
    if (playerRankNum !== null) {
      const oppRank = getRankPosition(state.worldState, c);
      const oppRankNum = typeof oppRank === "number" ? oppRank : oppRank === "champion" ? 0 : null;
      rankWeight = oppRankNum !== null ? Math.exp(-Math.abs(oppRankNum - playerRankNum) / 4) + 0.1 : 0.3;
    }

    return skillWeight * experienceWeight * rankWeight + 0.01;
  });
}

/**
 * Fait avancer la carriere d'un "tick" (section B). Ne fait rien si un
 * choix est deja en attente (event actif, combat programme, offres) —
 * l'UI doit d'abord resoudre l'etape en cours.
 */
export function advanceTurn(state: CareerState): CareerState {
  if (state.retired || state.activeEvent || state.pendingFight || state.pendingOffers.length > 0) return state;

  const rng = getRng(state);
  const age = ageFromDob(state.fighter.dateOfBirth, state.worldDate);

  if (state.fighter.careerWear >= 97 || age >= HARD_RETIREMENT_AGE) {
    return pushRng(finalizeRetirement(state, rng), rng);
  }

  if (!state.contract) {
    const offers = generateContractOffers(state, rng);
    if (offers.length > 0) {
      return pushRng({ ...state, pendingOffers: offers }, rng);
    }
  } else if (state.contract.fightsCompleted >= state.contract.fightsTotal) {
    const offers = generateContractOffers({ ...state, contract: null }, rng);
    return pushRng({ ...state, contract: null, pendingOffers: offers }, rng);
  }

  const retirementHistory = state.eventHistory["retirement_prompt"];
  const retirementCooldownOk =
    !retirementHistory ||
    (new Date(state.worldDate).getTime() - new Date(retirementHistory.lastFiredOn).getTime()) / 86400000 >= 180;
  if (retirementCooldownOk && rng.chance(retirementCheckProbability(age, state.fighter.careerWear))) {
    const evt = buildRetirementEvent();
    return pushRng(activateEvent(state, evt, rng), rng);
  }

  const due = state.pendingFollowUps.find((f) => f.fireOn <= state.worldDate);
  if (due) {
    const template = ALL_EVENTS.find((e) => e.id === due.eventId);
    const pendingFollowUps = state.pendingFollowUps.filter((f) => f !== due);
    if (template) {
      return pushRng(activateEvent({ ...state, pendingFollowUps }, template, rng), rng);
    }
    state = { ...state, pendingFollowUps };
  }

  if (state.contract) {
    // Laisse la place a plusieurs evenements narratifs entre deux combats
    // (section 2 : le jeu ne doit pas etre qu'une succession de fights),
    // et respecte un rythme de carriere realiste : un combattant pro ne
    // combat pas plus de 2-3 fois par an. Le camp ajoute encore 21-42
    // jours au-dela de ce minimum, donc l'ecart reel entre deux combats
    // depasse toujours 4 mois.
    const lastFightDate = state.fightHistory.at(-1)?.fight.date;
    const daysSinceLastFight = lastFightDate
      ? Math.round((new Date(state.worldDate).getTime() - new Date(lastFightDate).getTime()) / 86400000)
      : Infinity;

    // Une fois le delai minimum passe, un combat doit arriver vite (section
    // demandee : un veteran de 39 ans doit avoir un vrai palmares fourni,
    // pas 8-2). Peu de tours narratifs suffisent avant que l'opportunite
    // se concretise.
    const fightChance = daysSinceLastFight < MIN_DAYS_BETWEEN_FIGHTS ? 0 : Math.min(1, 0.92 + state.ticksSinceLastFight * 0.5);
    if (rng.chance(fightChance)) {
      const opponent = pickOpponent(state, rng);
      if (!opponent) {
        // Aucun adversaire dispo dans cette organisation/categorie de poids
        // (roster epuise cote monde simule) : plutot que de laisser le
        // combattant bloque sous un contrat mort jusqu'a la retraite
        // (bug identifie via sonde — un contrat sans adversaire pouvait
        // durer 15+ ans sans un seul combat), on libere le contrat pour
        // qu'il en retrouve un ailleurs des le prochain tour. Le temps doit
        // avancer ici (et le monde simule tourner) : sinon un cycle
        // signature->liberation peut boucler indefiniment sur la meme date
        // si la meme organisation vide est reproposee (bug egalement
        // identifie via sonde — carriere bloquee a 2000 iterations sans
        // jamais atteindre la retraite).
        const daysPassed = rng.int(20, 40);
        const worldDate = addDays(state.worldDate, daysPassed);
        const worldTicked = advanceWorld(state.worldState, daysPassed, rng, state.fighter.id);
        const agedFighter = applyAgingTick(state.fighter, ageFromDob(state.fighter.dateOfBirth, worldDate), daysPassed, rng);
        let next: CareerState = { ...state, fighter: agedFighter, worldState: worldTicked, worldDate, contract: null };
        next = syncPlayerIntoWorld(next);
        next = enforceHardRetirementAge(next, rng);
        return pushRng(next, rng);
      }
      {
        const org = getOrganization(state.fighter.organizationId!);
        const playerRank = getRankPosition(state.worldState, state.fighter);
        const hasEnoughFightsForTitle = totalFights(state.fighter) >= MIN_FIGHTS_FOR_TITLE_SHOT;
        const isTitleFight =
          playerRank === "champion" ||
          (typeof playerRank === "number" &&
            playerRank <= 3 &&
            hasEnoughFightsForTitle &&
            opponent.id === state.worldState.titles.find((t) => t.organizationId === org.id && t.weightClassId === state.fighter.weightClass)?.currentChampionId);
        const eventName = isTitleFight
          ? `${org.shortName} — Combat pour le titre`
          : `${org.shortName} Fight Night`;
        const next: CareerState = {
          ...state,
          pendingFight: {
            opponentId: opponent.id,
            organizationId: org.id,
            eventName,
            isTitleFight: !!isTitleFight,
            scheduledOn: addDays(state.worldDate, rng.int(21, 42)),
          },
        };
        return pushRng(next, rng);
      }
    }
  }

  const event = pickNextEvent(state, ALL_EVENTS, rng);
  if (!event) {
    const advanced = { ...state, worldDate: addDays(state.worldDate, 80) };
    return pushRng(advanced, rng);
  }
  return pushRng(activateEvent(state, event, rng), rng);
}

export function resolveEventChoice(state: CareerState, choiceId: string): CareerState {
  if (!state.activeEvent) return state;
  const rng = getRng(state);
  const choice = state.activeEvent.template.choices.find((c) => c.id === choiceId);
  if (!choice) return state;

  const before = state.worldDate;
  let next = applyChoice(state, choice, rng);
  next = syncPlayerIntoWorld(next);

  const days = Math.max(1, Math.round((new Date(next.worldDate).getTime() - new Date(before).getTime()) / 86400000));
  const worldTicked = advanceWorld(next.worldState, days, rng, next.fighter.id);
  const agedFighter = applyAgingTick(next.fighter, ageFromDob(next.fighter.dateOfBirth, next.worldDate), days, rng);

  next = { ...next, fighter: agedFighter, worldState: worldTicked, ticksSinceLastFight: next.ticksSinceLastFight + 1 };
  next = syncPlayerIntoWorld(next);

  if (next.flags.includes("career_retire_now")) {
    next = finalizeRetirement(next, rng);
  } else {
    next = enforceHardRetirementAge(next, rng);
  }

  return pushRng(next, rng);
}

export function chooseContractOffer(state: CareerState, offer: ContractOffer): CareerState {
  const org = getOrganization(offer.organizationId);
  const wasSigned = !!state.fighter.organizationId;
  let next: CareerState = {
    ...state,
    contract: {
      organizationId: offer.organizationId,
      fightsTotal: offer.fights,
      fightsCompleted: 0,
      showMoney: offer.showMoney,
      winBonus: offer.winBonus,
      signedOn: state.worldDate,
      exclusive: true,
    },
    pendingOffers: [],
    fighter: { ...state.fighter, organizationId: offer.organizationId },
    flags: state.flags.filter((f) => f !== "seeking_new_organization"),
  };
  next = syncPlayerIntoWorld(next);
  if (!wasSigned) {
    next = addMoment(next, { label: `Signature chez ${org.name}`, detail: `Premier contrat professionnel signe.`, kind: "org_signing" });
  } else {
    next = addMoment(next, { label: `Nouveau contrat chez ${org.name}`, detail: `${offer.fights} combats programmes.`, kind: "org_signing" });
  }
  return next;
}

export function declineOffers(state: CareerState): CareerState {
  return { ...state, pendingOffers: [], worldDate: addDays(state.worldDate, 80) };
}

/**
 * Refuser un combat propose (section 18) : preserve la sante/preparation,
 * mais coute un peu de reputation et de confiance du promoteur — et rien
 * ne garantit qu'une aussi bonne opportunite revienne vite.
 */
export function declinePendingFight(state: CareerState): CareerState {
  if (!state.pendingFight) return state;
  const rng = getRng(state);

  const daysPassed = rng.int(10, 20);
  const worldTicked = advanceWorld(state.worldState, daysPassed, rng, state.fighter.id);
  const worldDate = addDays(state.worldDate, daysPassed);
  const agedFighter = applyAgingTick(state.fighter, ageFromDob(state.fighter.dateOfBirth, worldDate), daysPassed, rng);

  const fighter: Fighter = {
    ...agedFighter,
    reputation: Math.max(0, agedFighter.reputation - 3),
    morale: Math.min(100, agedFighter.morale + 5),
    form: Math.min(100, agedFighter.form + 4),
  };

  let next: CareerState = {
    ...state,
    fighter,
    worldState: worldTicked,
    worldDate,
    relationships: { ...state.relationships, promoter: Math.max(-100, state.relationships.promoter - 6) },
    pendingFight: null,
  };
  next = syncPlayerIntoWorld(next);
  next = enforceHardRetirementAge(next, rng);
  return pushRng(next, rng);
}

export interface FightPlan {
  gameplan: Gameplan;
  campFocus: CampFocus;
}

export function resolvePendingFight(state: CareerState, plan: FightPlan): CareerState {
  if (!state.pendingFight) return state;
  const pendingFight = state.pendingFight;
  const rng = getRng(state);
  const fightDate = pendingFight.scheduledOn;

  const daysToFight = Math.max(
    1,
    Math.round((new Date(fightDate).getTime() - new Date(state.worldDate).getTime()) / 86400000),
  );
  const worldTicked = advanceWorld(state.worldState, daysToFight, rng, state.fighter.id);
  const camperFighter = applyAgingTick(state.fighter, ageFromDob(state.fighter.dateOfBirth, fightDate), daysToFight, rng);
  state = { ...state, worldDate: fightDate, worldState: worldTicked, fighter: camperFighter };

  const opponent = state.worldState.fighters[pendingFight.opponentId];
  if (!opponent) return { ...state, pendingFight: null };

  const campQuality = Math.round(
    50 + state.fighter.attributes.discipline * 0.2 + state.relationships.gym * 0.15 + rng.gaussian(0, 8),
  );
  // Le camp choisi booste reellement le paquet d'attributs correspondant
  // pour ce combat (section 25/94) — sans toucher aux attributs de base.
  const fighterForFight: Fighter = {
    ...state.fighter,
    attributes: applyCampFocusBoost(state.fighter.attributes, plan.campFocus),
  };

  const result = simulateFight(
    {
      fighterA: fighterForFight,
      fighterB: opponent,
      gameplanA: plan.gameplan,
      gameplanB: rng.pick<Gameplan>(["balanced", "pressure", "counter_striker", "wrestling_heavy", "cage_control"]),
      campQualityA: campQuality,
      campQualityB: 50 + rng.int(-10, 10),
      maxRounds: pendingFight.isTitleFight ? 5 : 3,
      organizationId: pendingFight.organizationId,
      eventName: pendingFight.eventName,
      date: pendingFight.scheduledOn,
      isTitleFight: pendingFight.isTitleFight,
      rivalryIntensity: state.fighterRelationships[opponent.id] ? Math.abs(state.fighterRelationships[opponent.id]) : 0,
      homeAdvantageFor: null,
    },
    rng,
  );

  const bonusPayout = computeBonusPayout(pendingFight.organizationId, result.bonusAwards, rng);
  if (bonusPayout > 0) result.bonusPayout = bonusPayout;

  const won = result.winnerId === state.fighter.id;
  const lost = result.winnerId === opponent.id;
  const isFinish = result.method === "ko" || result.method === "tko" || result.method === "submission";

  const fighter: Fighter = {
    ...state.fighter,
    record: {
      ...state.fighter.record,
      wins: state.fighter.record.wins + (won ? 1 : 0),
      losses: state.fighter.record.losses + (lost ? 1 : 0),
      draws: state.fighter.record.draws + (!won && !lost ? 1 : 0),
      winsByKo: state.fighter.record.winsByKo + (won && result.method === "ko" ? 1 : 0) + (won && result.method === "tko" ? 1 : 0),
      winsBySub: state.fighter.record.winsBySub + (won && result.method === "submission" ? 1 : 0),
      winsByDec: state.fighter.record.winsByDec + (won && !isFinish ? 1 : 0),
    },
    popularity: Math.min(100, state.fighter.popularity + (won ? (isFinish ? 6 : 3) : lost ? 1 : 2) + (result.isUpset && won ? 8 : 0)),
    momentum: Math.max(-100, Math.min(100, state.fighter.momentum + (won ? 15 : lost ? -18 : -2))),
    confidence: Math.max(0, Math.min(100, state.fighter.confidence + (won ? 8 : -10))),
    morale: Math.max(0, Math.min(100, state.fighter.morale + (won ? 6 : -12))),
    careerWear: Math.min(100, state.fighter.careerWear + rng.float(1.5, 3.5) + (lost && isFinish ? 1 : 0)),
    form: Math.max(0, state.fighter.form - rng.float(5, 12)),
  };

  const opponentAfter: Fighter = {
    ...opponent,
    record: {
      ...opponent.record,
      wins: opponent.record.wins + (lost ? 1 : 0),
      losses: opponent.record.losses + (won ? 1 : 0),
      draws: opponent.record.draws + (!won && !lost ? 1 : 0),
    },
    momentum: Math.max(-100, Math.min(100, opponent.momentum + (lost ? 15 : won ? -18 : -2))),
  };

  const purse = (state.contract ? state.contract.showMoney + (won ? state.contract.winBonus : 0) : 0) + bonusPayout;

  let next: CareerState = {
    ...state,
    fighter,
    worldState: {
      ...state.worldState,
      fighters: { ...state.worldState.fighters, [fighter.id]: fighter, [opponentAfter.id]: opponentAfter },
      recentFights: [...state.worldState.recentFights.slice(-40), result],
    },
    contract: state.contract ? { ...state.contract, fightsCompleted: state.contract.fightsCompleted + 1 } : null,
    finances: {
      careerEarnings: state.finances.careerEarnings + purse,
      netWorth: state.finances.netWorth + purse,
    },
    fightHistory: [
      ...state.fightHistory,
      {
        fight: result,
        opponentId: opponent.id,
        opponentName: `${opponent.firstName} ${opponent.lastName}`,
        opponentRecordAtTime: `${opponent.record.wins}-${opponent.record.losses}-${opponent.record.draws}`,
        result: won ? "win" : lost ? "loss" : "draw",
      },
    ],
    awards: [...state.awards, ...result.bonusAwards],
    fighterRelationships: {
      ...state.fighterRelationships,
      [opponent.id]: (state.fighterRelationships[opponent.id] ?? 0) + (lost ? -15 : won ? 5 : 0),
    },
    pendingFight: null,
    lastFightResult: result,
    ticksSinceLastFight: 0,
  };

  next.worldState = { ...next.worldState, rankings: rebuildAllRankings(next.worldState) };

  if (state.fightHistory.length === 0) {
    next = addMoment(next, { label: "Premier combat professionnel", detail: won ? "Victoire des tes debuts." : "Un bapteme du feu difficile.", kind: "debut" });
  }
  if (won && isFinish && state.fighter.record.winsByKo + state.fighter.record.winsBySub === 0) {
    next = addMoment(next, { label: "Premier finish", detail: `Victoire par ${result.method === "submission" ? "soumission" : "KO/TKO"}.`, kind: "first_ko" });
  }
  if (lost && state.fighter.record.losses === 0) {
    next = addMoment(next, { label: "Premiere defaite", detail: "La realite du haut niveau te rattrape.", kind: "first_loss" });
  }

  if (pendingFight.isTitleFight) {
    const org = getOrganization(pendingFight.organizationId);
    const title = next.worldState.titles.find((t) => t.organizationId === org.id && t.weightClassId === fighter.weightClass);
    if (title) {
      if (won) {
        const alreadyChampion = title.currentChampionId === fighter.id;
        next.worldState = {
          ...next.worldState,
          titles: next.worldState.titles.map((t) => (t.id === title.id ? { ...t, currentChampionId: fighter.id } : t)),
        };
        if (alreadyChampion) {
          next.titles = next.titles.map((t) => (t.titleId === title.id ? { ...t, defenses: t.defenses + 1 } : t));
          next = addMoment(next, { label: "Defense de titre reussie", detail: `Le regne continue chez ${org.name}.`, kind: "title_defense" });
        } else {
          next.titles = [...next.titles, { titleId: title.id, fighterId: fighter.id, wonOn: next.worldDate, defenses: 0 }];
          next = addMoment(next, { label: "Champion !", detail: `Titre remporte chez ${org.name}.`, kind: "title_win" });
        }
      } else {
        next.titles = next.titles.map((t) => (t.titleId === title.id && !t.lostOn ? { ...t, lostOn: next.worldDate } : t));
      }
    }
  }

  next = enforceHardRetirementAge(next, rng);
  return pushRng(next, rng);
}

export function finalizeRetirement(state: CareerState, rng: Rng): CareerState {
  const breakdown = computeLegacy(state);
  const legacyClass = classifyLegacy(breakdown.total);
  const epilogue = generateEpilogue(state, legacyClass, rng);

  let next: CareerState = {
    ...state,
    retired: true,
    retiredOn: state.worldDate,
    legacyScore: breakdown.total,
    legacyClass: legacyClass.id,
    epilogue,
    activeEvent: null,
    pendingFight: null,
    pendingOffers: [],
  };
  next = addMoment(next, { label: "Fin de carriere", detail: epilogue, kind: "retirement" });
  return next;
}

export function forceRetirementDueToWear(state: CareerState): CareerState {
  const rng = getRng(state);
  return pushRng(finalizeRetirement(state, rng), rng);
}
