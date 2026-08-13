import type { CareerPhase, CareerState } from "@/types";
import { getRankPosition } from "@/game/ranking/rankings";
import { ageFromDob } from "@/game/fighter/generate";

export function deriveCareerPhase(state: CareerState): CareerPhase {
  const { fighter, worldState } = state;
  const age = ageFromDob(fighter.dateOfBirth, state.worldDate);
  const fights = fighter.record.wins + fighter.record.losses;
  const rank = getRankPosition(worldState, fighter);

  if (fights === 0) return "amateur";
  if (rank === "champion") return "champion";
  if (age >= fighter.primeEnd + 4) return "decline";
  if (typeof rank === "number") return "ranked";
  if (age >= fighter.primeEnd + 1 && fights > 15) return "veteran";
  if (fighter.organizationId && fights < 8) return "prospect";
  return "regional";
}
