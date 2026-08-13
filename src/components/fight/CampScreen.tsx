"use client";

import { useState } from "react";
import type { CampFocus, CareerState, Gameplan } from "@/types";
import { computeSimplifiedRatings } from "@/types";
import { useCareerStore } from "@/store/careerStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { estimateWinProbability } from "@/game/fight/simulate";
import { getOrganization } from "@/data/organizations";

const CAMP_FOCUS_OPTIONS: { id: CampFocus; emoji: string; label: string }[] = [
  { id: "striking", emoji: "🥊", label: "Striking Camp" },
  { id: "wrestling", emoji: "🤼", label: "Wrestling Camp" },
  { id: "grappling", emoji: "🥋", label: "Grappling Camp" },
  { id: "cardio", emoji: "❤️", label: "Cardio Camp" },
  { id: "tactical", emoji: "🧠", label: "Tactical Camp" },
  { id: "weight_cut", emoji: "⚖️", label: "Weight Cut Focus" },
  { id: "balanced", emoji: "⚔️", label: "Balanced Camp" },
];

const GAMEPLAN_OPTIONS: { id: Gameplan; label: string }[] = [
  { id: "pressure", label: "Pression constante" },
  { id: "counter_striker", label: "Counter striker" },
  { id: "hunt_ko", label: "Chercher le KO" },
  { id: "wrestling_heavy", label: "Wrestling heavy" },
  { id: "submission_hunting", label: "Submission hunting" },
  { id: "cage_control", label: "Cage control" },
  { id: "point_fighting", label: "Point fighting" },
  { id: "balanced", label: "Balanced" },
  { id: "survive_early_push_late", label: "Survivre tot / pousser tard" },
];

export function CampScreen({ career }: { career: CareerState }) {
  const fight = useCareerStore((s) => s.fight);
  const declineFight = useCareerStore((s) => s.declineFight);
  const [campFocus, setCampFocus] = useState<CampFocus>("balanced");
  const [gameplan, setGameplan] = useState<Gameplan>("balanced");

  const pending = career.pendingFight!;
  const opponent = career.worldState.fighters[pending.opponentId];
  const org = getOrganization(pending.organizationId);
  const oppRatings = opponent ? computeSimplifiedRatings(opponent.attributes) : null;
  const winProb = opponent ? Math.round(estimateWinProbability(career.fighter, opponent) * 100) : 50;

  return (
    <div className="flex flex-col gap-4">
      <Card className={pending.isTitleFight ? "border-accent-gold" : ""}>
        <div className="text-xs uppercase tracking-widest text-muted">{org.name}</div>
        <div className="text-base font-bold">{pending.eventName}</div>
        {opponent && (
          <div className="mt-3 flex items-center justify-between text-sm">
            <div>
              <div className="font-semibold">
                {opponent.firstName} {opponent.lastName}
              </div>
              <div className="text-xs text-muted">
                {opponent.record.wins}-{opponent.record.losses}-{opponent.record.draws}
                {oppRatings ? ` · OVR ${oppRatings.overall}` : ""}
              </div>
            </div>
            <div className="text-right text-xs text-muted">
              <div>Tes chances</div>
              <div className="text-lg font-bold text-foreground">{winProb}%</div>
            </div>
          </div>
        )}
      </Card>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-muted">Camp d&apos;entrainement</h3>
        <div className="grid grid-cols-2 gap-2">
          {CAMP_FOCUS_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setCampFocus(opt.id)}
              className={`rounded-xl border p-3 text-left text-xs ${campFocus === opt.id ? "border-accent-gold bg-surface-2" : "border-border bg-surface"}`}
            >
              {opt.emoji} {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-muted">Plan de jeu</h3>
        <div className="grid grid-cols-2 gap-2">
          {GAMEPLAN_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setGameplan(opt.id)}
              className={`rounded-xl border p-3 text-left text-xs ${gameplan === opt.id ? "border-accent-gold bg-surface-2" : "border-border bg-surface"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={() => fight(gameplan, campFocus)}>Entrer dans la cage</Button>
      <Button variant="ghost" onClick={declineFight}>
        Refuser ce combat
      </Button>
    </div>
  );
}
