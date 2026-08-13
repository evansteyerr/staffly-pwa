import { describe, expect, it } from "vitest";
import { simulateFight } from "./simulate";
import { Rng } from "@/game/rng/prng";
import { generateNpcFighter } from "@/game/fighter/generate";

function makeFighter(quality: number, seed: string) {
  const rng = Rng.fromString(seed);
  return generateNpcFighter(
    {
      nationalityCode: "FR",
      gender: "male",
      weightClassId: "m_lightweight",
      quality,
      age: 27,
      worldDate: "2026-01-01",
      organizationId: "sfc",
    },
    rng,
  );
}

describe("simulateFight", () => {
  it("est deterministe pour une meme seed", () => {
    const fighterA = makeFighter(80, "fighter-a");
    const fighterB = makeFighter(60, "fighter-b");

    const input = {
      fighterA,
      fighterB,
      gameplanA: "balanced" as const,
      gameplanB: "pressure" as const,
      campQualityA: 60,
      campQualityB: 55,
      maxRounds: 3 as const,
      organizationId: "sfc",
      eventName: "Test Fight Night",
      date: "2026-06-01",
      isTitleFight: false,
      rivalryIntensity: 0,
      homeAdvantageFor: null,
    };

    const resultA = simulateFight(input, Rng.fromString("fight-seed"));
    const resultB = simulateFight(input, Rng.fromString("fight-seed"));

    expect(resultA).toEqual(resultB);
  });

  it("un favori modere gagne plus souvent qu'un outsider, sans ecraser systematiquement", () => {
    let favoriteWins = 0;
    const trials = 80;
    for (let i = 0; i < trials; i++) {
      const strong = makeFighter(74, `strong-${i}`);
      const weak = makeFighter(60, `weak-${i}`);
      const result = simulateFight(
        {
          fighterA: strong,
          fighterB: weak,
          gameplanA: "balanced",
          gameplanB: "balanced",
          campQualityA: 60,
          campQualityB: 60,
          maxRounds: 3,
          organizationId: "sfc",
          eventName: "Test",
          date: "2026-06-01",
          isTitleFight: false,
          rivalryIntensity: 0,
          homeAdvantageFor: null,
        },
        Rng.fromString(`trial-${i}`),
      );
      if (result.winnerId === strong.id) favoriteWins++;
    }
    // Le favori doit gagner plus souvent qu'un pile ou face, mais des upsets doivent rester possibles.
    expect(favoriteWins).toBeGreaterThan(trials * 0.5);
    expect(favoriteWins).toBeLessThan(trials);
  });

  it("un tres gros mismatch tourne tres largement en faveur du favori", () => {
    const strong = makeFighter(90, "huge-strong");
    const weak = makeFighter(40, "huge-weak");
    const result = simulateFight(
      {
        fighterA: strong,
        fighterB: weak,
        gameplanA: "balanced",
        gameplanB: "balanced",
        campQualityA: 60,
        campQualityB: 60,
        maxRounds: 3,
        organizationId: "sfc",
        eventName: "Test",
        date: "2026-06-01",
        isTitleFight: false,
        rivalryIntensity: 0,
        homeAdvantageFor: null,
      },
      Rng.fromString("huge-mismatch-seed"),
    );
    expect(result.winnerId).toBe(strong.id);
  });
});
