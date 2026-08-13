import type { EventTemplate } from "@/types";

/**
 * Contenu "de fond" volontairement generique et repetable (section 111) :
 * sert de filet de securite pour que le joueur ait toujours quelque chose
 * a lire et un vrai choix a faire, meme quand tout le contenu narratif
 * specifique de la carriere a deja ete vu. Poids faible : ce contenu ne
 * doit sortir que quand rien de plus interessant n'est disponible.
 */
export const FILLER_EVENTS: EventTemplate[] = [
  {
    id: "filler_quiet_training_block",
    category: "training",
    title: "Un bloc d'entrainement tranquille",
    description: "Pas d'evenement particulier ces derniers temps : juste le travail, jour apres jour.",
    weight: 1.5,
    cooldownDays: 20,
    choices: [
      {
        id: "push_hard",
        label: "Pousser plus fort que d'habitude",
        visibleEffects: { form: 3, careerWear: 1 },
        timeAdvanceDaysMin: 14,
        timeAdvanceDaysMax: 28,
      },
      {
        id: "steady",
        label: "Garder un rythme regulier",
        visibleEffects: { form: 1, morale: 2 },
        timeAdvanceDaysMin: 14,
        timeAdvanceDaysMax: 28,
      },
    ],
  },
  {
    id: "filler_rest_days",
    category: "mental",
    title: "Quelques jours de repos",
    description: "Le corps et la tete ont besoin de souffler entre deux blocs de preparation.",
    weight: 1.5,
    cooldownDays: 20,
    choices: [
      {
        id: "full_rest",
        label: "Te reposer completement",
        visibleEffects: { morale: 5, form: -1 },
        hiddenEffects: { stress: -4 },
        timeAdvanceDaysMin: 10,
        timeAdvanceDaysMax: 21,
      },
      {
        id: "light_training",
        label: "Garder un peu d'activite",
        visibleEffects: { form: 2 },
        timeAdvanceDaysMin: 10,
        timeAdvanceDaysMax: 21,
      },
    ],
  },
  {
    id: "filler_fan_question",
    category: "social_media",
    title: "Une question revient souvent chez tes fans",
    description: "Sur tes reseaux, la meme question revient : c'est quoi la suite pour toi ?",
    weight: 1.5,
    cooldownDays: 20,
    choices: [
      {
        id: "ambitious_answer",
        label: "Repondre avec ambition",
        visibleEffects: { popularity: 2, confidence: 2 },
        timeAdvanceDaysMin: 7,
        timeAdvanceDaysMax: 14,
      },
      {
        id: "humble_answer",
        label: "Repondre avec humilite",
        visibleEffects: { reputation: 2 },
        timeAdvanceDaysMin: 7,
        timeAdvanceDaysMax: 14,
      },
    ],
  },
  {
    id: "filler_coach_check_in",
    category: "coach",
    title: "Point d'etape avec ton coach",
    description: "Ton coach fait le bilan de ta progression recente, sans surprise particuliere.",
    weight: 1.5,
    cooldownDays: 20,
    choices: [
      {
        id: "focus_weaknesses",
        label: "Travailler tes points faibles",
        visibleEffects: {},
        hiddenEffects: { coachTrust: 4, attributeBoost: { key: "discipline", amount: 1 } },
        timeAdvanceDaysMin: 14,
        timeAdvanceDaysMax: 28,
      },
      {
        id: "focus_strengths",
        label: "Continuer a exploiter tes points forts",
        visibleEffects: { confidence: 2 },
        timeAdvanceDaysMin: 14,
        timeAdvanceDaysMax: 28,
      },
    ],
  },
  {
    id: "filler_life_outside_cage",
    category: "friendship",
    title: "La vie continue en dehors de la cage",
    description: "Entre deux camps, il y a aussi une vie a cote du sport.",
    weight: 1.5,
    cooldownDays: 20,
    choices: [
      {
        id: "make_time",
        label: "Prendre du temps pour tes proches",
        visibleEffects: { morale: 4 },
        timeAdvanceDaysMin: 7,
        timeAdvanceDaysMax: 21,
      },
      {
        id: "stay_locked_in",
        label: "Rester focus sur l'objectif",
        visibleEffects: { form: 2 },
        hiddenEffects: { stress: 2 },
        timeAdvanceDaysMin: 7,
        timeAdvanceDaysMax: 21,
      },
    ],
  },
];
