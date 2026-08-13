import type { EventTemplate } from "@/types";

export const MONEY_EVENTS: EventTemplate[] = [
  {
    id: "money_sponsor_local",
    category: "sponsor",
    title: "Une marque locale te propose un partenariat",
    description: "{fighterName}, un equipementier local souhaite sponsoriser tes prochains combats.",
    weight: 8,
    cooldownDays: 250,
    maxOccurrences: 4,
    choices: [
      {
        id: "accept",
        label: "Accepter le partenariat",
        visibleEffects: { money: 800, popularity: 2 },
        timeAdvanceDaysMin: 7,
        timeAdvanceDaysMax: 14,
      },
      {
        id: "decline",
        label: "Refuser, image pas alignee",
        visibleEffects: { reputation: 2 },
        timeAdvanceDaysMin: 3,
        timeAdvanceDaysMax: 7,
      },
    ],
  },
  {
    id: "money_investment",
    category: "money",
    title: "Un ami te propose d'investir",
    description: "Un proche te propose de placer une partie de tes gains dans son projet. Risque et opportunite melanges.",
    minPopularity: 15,
    weight: 3,
    cooldownDays: 500,
    maxOccurrences: 2,
    choices: [
      {
        id: "invest",
        label: "Investir une partie de tes gains",
        successChance: 0.45,
        visibleEffects: { money: 4000 },
        onFailure: { money: -2500, stress: 8 },
        timeAdvanceDaysMin: 30,
        timeAdvanceDaysMax: 60,
      },
      {
        id: "pass",
        label: "Ne pas investir",
        visibleEffects: {},
        timeAdvanceDaysMin: 3,
        timeAdvanceDaysMax: 7,
      },
    ],
  },
  {
    id: "money_taxes",
    category: "money",
    title: "L'administration fiscale s'invite",
    description: "Une regularisation fiscale tombe apres une belle annee de gains.",
    minPopularity: 20,
    weight: 3,
    cooldownDays: 600,
    maxOccurrences: 2,
    choices: [
      {
        id: "pay",
        label: "Payer immediatement",
        visibleEffects: { money: -3000, stress: -4 },
        timeAdvanceDaysMin: 7,
        timeAdvanceDaysMax: 14,
      },
      {
        id: "delay",
        label: "Etaler les paiements",
        visibleEffects: { stress: 6 },
        hiddenEffects: { financialSecurity: -8 },
        timeAdvanceDaysMin: 7,
        timeAdvanceDaysMax: 14,
      },
    ],
  },
];
