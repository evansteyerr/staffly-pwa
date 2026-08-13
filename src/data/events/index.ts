import type { EventTemplate } from "@/types";
import { TRAINING_EVENTS } from "./training";
import { MONEY_EVENTS } from "./money";
import { SOCIAL_EVENTS } from "./social";
import { CAREER_EVENTS } from "./career";
import { EXPANSION_EVENTS } from "./expansion";
import { FILLER_EVENTS } from "./filler";

export const ALL_EVENTS: EventTemplate[] = [
  ...TRAINING_EVENTS,
  ...MONEY_EVENTS,
  ...SOCIAL_EVENTS,
  ...CAREER_EVENTS,
  ...EXPANSION_EVENTS,
  ...FILLER_EVENTS,
];
