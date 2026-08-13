export type EventCategory =
  | "training"
  | "money"
  | "family"
  | "friendship"
  | "coach"
  | "manager"
  | "media"
  | "rivalry"
  | "injury"
  | "contract"
  | "sponsor"
  | "social_media"
  | "mental"
  | "weight"
  | "fame"
  | "scandal"
  | "opportunity"
  | "retirement"
  | "fight_offer";

export type CareerPhase = "amateur" | "prospect" | "regional" | "ranked" | "champion" | "veteran" | "decline";

/** Sac d'effets qu'un choix peut appliquer — un sur-ensemble optionnel. */
export interface EffectBag {
  form: number;
  morale: number;
  confidence: number;
  reputation: number;
  popularity: number;
  momentum: number;
  careerWear: number;
  money: number;
  hunger: number;
  ego: number;
  stress: number;
  mediaPressure: number;
  coachTrust: number;
  promoterTrust: number;
  financialSecurity: number;
  relationshipCoach: number;
  relationshipManager: number;
  relationshipGym: number;
  relationshipPromoter: number;
  attributeBoost: { key: string; amount: number } | null;
}

export interface EventChoice {
  id: string;
  label: string;
  flavor?: string;
  visibleEffects: Partial<EffectBag>;
  hiddenEffects?: Partial<EffectBag>;
  setFlags?: string[];
  removeFlags?: string[];
  followUps?: { eventId: string; delayDaysMin: number; delayDaysMax: number }[];
  timeAdvanceDaysMin: number;
  timeAdvanceDaysMax: number;
  /** Chance (0-1) que ce choix "réussisse" (ex: négociation) ; sinon un choix d'échec alternatif est appliqué. */
  successChance?: number;
  onFailure?: Partial<EffectBag>;
}

export interface EventTemplate {
  id: string;
  category: EventCategory;
  title: string;
  description: string;
  minAge?: number;
  maxAge?: number;
  careerPhase?: CareerPhase[];
  requiredOrganizationTier?: ("regional" | "mid" | "elite")[];
  requiredFlags?: string[];
  forbiddenFlags?: string[];
  minPopularity?: number;
  maxPopularity?: number;
  weight: number;
  cooldownDays: number;
  maxOccurrences?: number;
  choices: EventChoice[];
}

export interface ScheduledEvent {
  eventId: string;
  fireOn: string; // ISO date
}

export interface ActiveEvent {
  template: EventTemplate;
  renderedTitle: string;
  renderedDescription: string;
}

export interface CareerMoment {
  id: string;
  date: string;
  label: string;
  detail: string;
  kind:
    | "debut"
    | "first_ko"
    | "first_loss"
    | "first_title"
    | "org_signing"
    | "ranked_entry"
    | "main_event"
    | "title_shot"
    | "title_win"
    | "title_defense"
    | "double_champ"
    | "retirement"
    | "cut"
    | "comeback"
    | "other";
}
