"use client";

import type { CareerState, FightMethod } from "@/types";
import { useCareerStore } from "@/store/careerStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const METHOD_LABELS: Record<FightMethod, string> = {
  ko: "KO",
  tko: "TKO",
  submission: "Soumission",
  unanimous_decision: "Decision unanime",
  split_decision: "Decision partagee",
  majority_decision: "Decision majoritaire",
  draw: "Match nul",
  doctor_stoppage: "Arret medecin",
  dq: "Disqualification",
  no_contest: "No contest",
};

export function FightResult({ career }: { career: CareerState }) {
  const clearFightResult = useCareerStore((s) => s.clearFightResult);
  const result = career.lastFightResult!;
  const opponent = career.worldState.fighters[result.fighterBId];
  const won = result.winnerId === career.fighter.id;
  const isDraw = !result.winnerId;

  return (
    <div className="flex flex-col gap-4">
      <Card className={won ? "border-emerald-600" : isDraw ? "border-border" : "border-accent-red"}>
        <div className="text-center">
          <div className={`text-2xl font-black ${won ? "text-emerald-500" : isDraw ? "text-muted" : "text-accent-red-bright"}`}>
            {won ? "VICTOIRE" : isDraw ? "MATCH NUL" : "DEFAITE"}
          </div>
          <div className="mt-1 text-sm text-muted">
            {METHOD_LABELS[result.method]}
            {result.finishingMove ? ` — ${result.finishingMove}` : ""} · Round {result.round} · {result.time}
          </div>
          {result.isUpset && <div className="mt-2 text-xs font-semibold text-accent-gold">⚡ ENORME SURPRISE</div>}
        </div>
        {opponent && (
          <div className="mt-3 text-center text-sm text-muted">
            vs {opponent.firstName} {opponent.lastName} ({opponent.record.wins}-{opponent.record.losses}-{opponent.record.draws})
          </div>
        )}
      </Card>

      <div className="flex flex-col gap-2">
        {result.rounds.map((r) => (
          <div key={r.round} className="rounded-xl border border-border bg-surface-2 p-3 text-sm text-muted">
            {r.summary}
          </div>
        ))}
      </div>

      <Card>
        <div className="grid grid-cols-2 gap-3 text-center text-xs">
          <div>
            <div className="text-muted">Coups significatifs</div>
            <div className="text-base font-bold">
              {result.rounds.reduce((s, r) => s + r.significantStrikesLanded.fighterA, 0)}
            </div>
          </div>
          <div>
            <div className="text-muted">Takedowns</div>
            <div className="text-base font-bold">{result.rounds.reduce((s, r) => s + r.takedowns.fighterA, 0)}</div>
          </div>
        </div>
      </Card>

      <Button onClick={clearFightResult}>Continuer</Button>
    </div>
  );
}
