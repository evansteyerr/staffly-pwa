import type { CareerState } from "@/types";
import { getNationality } from "@/data/names";
import { getOrganization } from "@/data/organizations";
import { getWeightClass } from "@/data/organizations/weightClasses";
import { ageFromDob } from "@/game/fighter/generate";
import { getRankPosition } from "@/game/ranking/rankings";

/** Moteur de templating minimal (section 151) — remplace {var} par des donnees reelles de la carriere. */
export function renderTemplate(text: string, state: CareerState, extra?: Record<string, string>): string {
  const { fighter, worldState } = state;
  const org = fighter.organizationId ? getOrganization(fighter.organizationId) : null;
  const rank = getRankPosition(worldState, fighter);
  const rankLabel = rank === "champion" ? "Champion" : rank ? `#${rank}` : "Non classe";

  const vars: Record<string, string> = {
    fighterName: `${fighter.firstName} ${fighter.lastName}`,
    nickname: fighter.nickname ?? fighter.lastName,
    age: String(ageFromDob(fighter.dateOfBirth, state.worldDate)),
    organization: org?.name ?? "agent libre",
    weightClass: getWeightClass(fighter.weightClass).label,
    record: `${fighter.record.wins}-${fighter.record.losses}-${fighter.record.draws}`,
    country: getNationality(fighter.nationality).label,
    ranking: rankLabel,
    ...extra,
  };

  return text.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);
}
