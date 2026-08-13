import { describe, expect, it } from "vitest";
import { validateRealRoster } from "@/data/fighters/realRosterSchema";
import { convertRealRoster } from "./importRealFighter";

describe("import du roster reel", () => {
  it("valide et convertit une entree correcte", () => {
    const raw = [
      {
        firstName: "Test",
        lastName: "Champion",
        gender: "male",
        nationality: "France",
        weightClass: "Lightweight",
        organizationId: "ufc",
        record: { wins: 20, losses: 2, draws: 0 },
        ranking: "champion",
        dateOfBirth: "1994-03-12",
        source: "exemple de test",
        lastVerifiedAt: "2026-08-13",
      },
    ];

    const validated = validateRealRoster(raw);
    expect(validated).toHaveLength(1);

    const fighters = convertRealRoster(validated, "test-seed", "2026-01-01");
    expect(fighters).toHaveLength(1);
    expect(fighters[0].firstName).toBe("Test");
    expect(fighters[0].lastName).toBe("Champion");
    expect(fighters[0].record.wins).toBe(20);
    expect(fighters[0].record.losses).toBe(2);
    expect(fighters[0].source).toBe("real");
    expect(fighters[0].weightClass).toBe("m_lightweight");
    expect(fighters[0].nationality).toBe("FR");
  });

  it("rejette une entree invalide sans faire planter l'import", () => {
    const raw = [
      { firstName: "Incomplet" }, // il manque des champs obligatoires
      {
        firstName: "Valide",
        lastName: "Combattant",
        gender: "female",
        nationality: "Bresil",
        weightClass: "Bantamweight",
        organizationId: "ufc",
        record: { wins: 10, losses: 3, draws: 1 },
        ranking: 5,
        dateOfBirth: null,
        source: "exemple",
        lastVerifiedAt: "2026-08-13",
      },
    ];

    const validated = validateRealRoster(raw);
    expect(validated).toHaveLength(1);
    expect(validated[0].firstName).toBe("Valide");
  });

  it("ignore proprement une categorie de poids non reconnue", () => {
    const raw = [
      {
        firstName: "Categorie",
        lastName: "Inconnue",
        gender: "male",
        nationality: "France",
        weightClass: "Poids extraterrestre",
        organizationId: "ufc",
        record: { wins: 5, losses: 1, draws: 0 },
        source: "exemple",
        lastVerifiedAt: "2026-08-13",
      },
    ];
    const validated = validateRealRoster(raw);
    const fighters = convertRealRoster(validated, "test-seed-2", "2026-01-01");
    expect(fighters).toHaveLength(0);
  });
});
