import type { EventTemplate } from "@/types";
import { TRAINING_EVENTS } from "./training";
import { MONEY_EVENTS } from "./money";
import { SOCIAL_EVENTS } from "./social";
import { CAREER_EVENTS } from "./career";

export const ALL_EVENTS: EventTemplate[] = [
  ...TRAINING_EVENTS,
  ...MONEY_EVENTS,
  ...SOCIAL_EVENTS,
  ...CAREER_EVENTS,
];
