import { describe, expect, it } from "vitest";
import {
  advanceTurn,
  chooseContractOffer,
  createCareer,
  resolveEventChoice,
  resolvePendingFight,
  type NewCareerInput,
} from "./careerEngine";
import type { CareerState } from "@/types";

const BASE_INPUT: NewCareerInput = {
  seed: "determinism-test-seed",
  firstName: "Test",
  lastName: "Fighter",
  gender: "male",
  nationalityCode: "FR",
  weightClassId: "m_lightweight",
  birthYearsAgo: 19,
  creationChoices: {
    styleId: "modern_mma",
    originId: "hard_neighborhood",
    lifestyleId: "balanced",
    entourageId: "family",
  },
};

/** Fait avancer une carriere en prenant toujours le premier choix disponible, pour un nombre borne d'iterations. */
function runDeterministicSimulation(seed: string, iterations: number): CareerState {
  let state = createCareer({ ...BASE_INPUT, seed });

  for (let i = 0; i < iterations && !state.retired; i++) {
    if (state.activeEvent) {
      state = resolveEventChoice(state, state.activeEvent.template.choices[0].id);
    } else if (state.pendingFight) {
      state = resolvePendingFight(state, { gameplan: "balanced", campFocus: "balanced" });
    } else if (state.pendingOffers.length > 0) {
      state = chooseContractOffer(state, state.pendingOffers[0]);
    } else {
      state = advanceTurn(state);
    }
  }
  return state;
}

describe("careerEngine determinisme", () => {
  it("meme seed + memes choix => meme carriere", () => {
    const a = runDeterministicSimulation("same-seed-abc", 400);
    const b = runDeterministicSimulation("same-seed-abc", 400);

    expect(a.fighter.record).toEqual(b.fighter.record);
    expect(a.worldDate).toEqual(b.worldDate);
    expect(a.fighter.attributes).toEqual(b.fighter.attributes);
    expect(a.finances).toEqual(b.finances);
    expect(a.careerHistory.map((m) => m.label)).toEqual(b.careerHistory.map((m) => m.label));
    expect(a.legacyScore).toEqual(b.legacyScore);
  });

  it("des seeds differentes produisent generalement des carrieres differentes", () => {
    const a = runDeterministicSimulation("seed-one", 200);
    const b = runDeterministicSimulation("seed-two", 200);

    const same = JSON.stringify(a.fighter.record) === JSON.stringify(b.fighter.record) && a.worldDate === b.worldDate;
    expect(same).toBe(false);
  });

  it("une carriere peut progresser sans planter jusqu'a un nombre d'iterations raisonnable", () => {
    const state = runDeterministicSimulation("stability-seed", 600);
    expect(state.fighter.record.wins + state.fighter.record.losses + state.fighter.record.draws).toBeGreaterThan(0);
    expect(state.careerHistory.length).toBeGreaterThan(0);
  });
});
