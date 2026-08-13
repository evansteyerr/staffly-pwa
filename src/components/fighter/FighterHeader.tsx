"use client";

import type { CareerState } from "@/types";
import { computeSimplifiedRatings } from "@/types";
import { ageFromDob } from "@/game/fighter/generate";
import { getNationality } from "@/data/names";
import { getWeightClass } from "@/data/organizations/weightClasses";
import { getOrganization } from "@/data/organizations";
import { getRankPosition } from "@/game/ranking/rankings";
import { StatBar } from "@/components/ui/StatBar";

export function FighterHeader({ career }: { career: CareerState }) {
  const { fighter } = career;
  const ratings = computeSimplifiedRatings(fighter.attributes);
  const age = ageFromDob(fighter.dateOfBirth, career.worldDate);
  const nat = getNationality(fighter.nationality);
  const wc = getWeightClass(fighter.weightClass);
  const org = fighter.organizationId ? getOrganization(fighter.organizationId) : null;
  const rank = getRankPosition(career.worldState, fighter);
  const rankLabel = rank === "champion" ? "🏆 Champion" : rank ? `#${rank}` : "Non classe";

  const borderClass =
    rank === "champion"
      ? "border-accent-gold"
      : org?.tier === "elite"
        ? "border-zinc-300"
        : org?.tier === "mid"
          ? "border-amber-700"
          : "border-border";

  return (
    <div className={`rounded-2xl border-2 ${borderClass} bg-surface p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">
            {nat.flag} {nat.label} · {wc.label}
          </div>
          <h1 className="text-xl font-bold leading-tight">
            {fighter.firstName} {fighter.lastName}
          </h1>
          {fighter.nickname && <div className="text-sm italic text-accent-gold">&ldquo;{fighter.nickname}&rdquo;</div>}
        </div>
        <div className="text-right text-xs text-muted">
          <div>{age} ans</div>
          <div className="mt-1 font-semibold text-foreground">{rankLabel}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="font-mono text-lg font-bold">
          {fighter.record.wins}-{fighter.record.losses}-{fighter.record.draws}
        </span>
        <span className="text-muted">{org ? org.name : "Agent libre"}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
        <StatBar label="Striking" value={ratings.striking} />
        <StatBar label="Grappling" value={ratings.grappling} />
        <StatBar label="Physique" value={ratings.physical} />
        <StatBar label="Mental" value={ratings.mental} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-5">
        <StatBar label="Forme" value={fighter.form} colorClass="bg-emerald-500" />
        <StatBar label="Moral" value={fighter.morale} colorClass="bg-sky-500" />
        <StatBar label="Confiance" value={fighter.confidence} colorClass="bg-violet-500" />
        <StatBar label="Reputation" value={fighter.reputation} colorClass="bg-orange-500" />
        <StatBar label="Popularite" value={fighter.popularity} colorClass="bg-accent-gold" />
      </div>
    </div>
  );
}
