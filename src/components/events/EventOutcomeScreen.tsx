"use client";

import type { EffectBag, EventOutcome } from "@/types";
import { useCareerStore } from "@/store/careerStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const EFFECT_LABELS: Record<keyof EffectBag, string> = {
  form: "Forme",
  morale: "Moral",
  confidence: "Confiance",
  reputation: "Reputation",
  popularity: "Popularite",
  momentum: "Momentum",
  careerWear: "Usure",
  money: "Argent",
  hunger: "Ambition",
  ego: "Ego",
  stress: "Stress",
  mediaPressure: "Pression mediatique",
  coachTrust: "Confiance coach",
  promoterTrust: "Confiance promoteur",
  financialSecurity: "Securite financiere",
  relationshipCoach: "Relation coach",
  relationshipManager: "Relation manager",
  relationshipGym: "Relation salle",
  relationshipPromoter: "Relation promoteur",
  attributeBoost: "Progres technique",
};

// Pour ces stats, une hausse est en fait defavorable (ex: l'usure) : la couleur du chip s'inverse.
const INVERTED_KEYS = new Set<keyof EffectBag>(["careerWear", "stress", "mediaPressure", "ego"]);

function formatEffectChips(effects: Partial<EffectBag>): { label: string; positive: boolean }[] {
  const chips: { label: string; positive: boolean }[] = [];
  for (const key of Object.keys(effects) as (keyof EffectBag)[]) {
    const value = effects[key];
    if (value === undefined || value === null) continue;
    if (key === "attributeBoost") {
      if (typeof value === "object" && "amount" in value) {
        chips.push({ label: `+${value.amount} ${EFFECT_LABELS.attributeBoost}`, positive: true });
      }
      continue;
    }
    const num = value as number;
    if (num === 0) continue;
    const positive = INVERTED_KEYS.has(key) ? num < 0 : num > 0;
    const display = key === "money" ? `${num > 0 ? "+" : ""}${num.toLocaleString("fr-FR")} €` : `${num > 0 ? "+" : ""}${num}`;
    chips.push({ label: `${display} ${EFFECT_LABELS[key]}`, positive });
  }
  return chips;
}

export function EventOutcomeScreen({ outcome }: { outcome: EventOutcome }) {
  const clearEventOutcome = useCareerStore((s) => s.clearEventOutcome);
  const chips = formatEffectChips(outcome.effects);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="text-xs uppercase tracking-widest text-muted">{outcome.eventTitle}</div>
        <div className="mt-2 flex items-center gap-2">
          {outcome.success === true && <span className="text-lg">✅</span>}
          {outcome.success === false && <span className="text-lg">❌</span>}
          <p className="text-sm leading-relaxed text-foreground">{outcome.resultLabel}</p>
        </div>

        {chips.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {chips.map((chip, i) => (
              <span
                key={i}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  chip.positive
                    ? "border-emerald-700 bg-emerald-950/40 text-emerald-400"
                    : "border-accent-red bg-red-950/30 text-accent-red-bright"
                }`}
              >
                {chip.label}
              </span>
            ))}
          </div>
        )}
      </Card>

      <Button onClick={clearEventOutcome}>Continuer</Button>
    </div>
  );
}
