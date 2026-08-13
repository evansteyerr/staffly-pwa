import { z } from "zod";
import { NATIONALITIES } from "@/data/names";
import { WEIGHT_CLASSES } from "@/data/organizations/weightClasses";

/**
 * Format d'import du roster reel (section 5/125-127 du cahier des
 * charges) : separe strictement les donnees FACTUELLES (nom, categorie,
 * nationalite, palmares, classement — fournies par l'utilisateur ou une
 * source appropriee) des donnees INVENTEES par le moteur (ratings
 * detailles, potentiel cache...). Le moteur ne genere jamais de "rating
 * officiel" pour un vrai combattant : il derive uniquement des attributs
 * de simulation a partir du niveau reel indique (classement/palmares),
 * clairement marques comme simules.
 *
 * `source` et `lastVerifiedAt` sont obligatoires pour toute entree
 * "reelle" : on ne veut jamais una donnee sans provenance tracee.
 */
export const RealFighterRecordSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  nickname: z.string().optional(),
  gender: z.enum(["male", "female"]),
  /** Nom de pays en clair (ex: "France", "USA", "Bresil") — resolu vers un code interne, voir resolveNationality. */
  nationality: z.string().min(1),
  /** Nom de categorie en clair (ex: "Lightweight", "Poids leger", "Welterweight") — resolu vers un id interne. */
  weightClass: z.string().min(1),
  organizationId: z.literal("ufc"),
  record: z.object({
    wins: z.number().int().min(0),
    losses: z.number().int().min(0),
    draws: z.number().int().min(0).default(0),
  }),
  /** Classement officiel au moment du snapshot : 1-15, "champion", ou null si non classe/inconnu. */
  ranking: z.union([z.number().int().min(1).max(15), z.literal("champion"), z.null()]).optional(),
  /** ISO date ; null explicite si inconnue (jamais invente). */
  dateOfBirth: z.string().nullable().optional(),
  height: z.number().positive().nullable().optional(),
  reach: z.number().positive().nullable().optional(),
  /** D'ou vient cette donnee (ex: "ufc.com roster, aout 2026"). Obligatoire : pas de donnee sans provenance. */
  source: z.string().min(1),
  /** Date a laquelle l'utilisateur a verifie/fourni cette donnee. */
  lastVerifiedAt: z.string().min(1),
});

export type RealFighterRecord = z.infer<typeof RealFighterRecordSchema>;

export function resolveNationalityCode(label: string): string {
  const normalized = label.trim().toLowerCase();
  const match = NATIONALITIES.find(
    (n) => n.label.toLowerCase() === normalized || n.code.toLowerCase() === normalized,
  );
  return match?.code ?? "FR";
}

// Racine commune (sans "poids"/"weight") -> suffixe d'id partage entre hommes/femmes.
// Couvre les noms de division usuels en anglais (UFC) et en francais.
const WEIGHT_CLASS_ALIASES: Record<string, string> = {
  straw: "strawweight",
  paille: "strawweight",
  fly: "flyweight",
  mouche: "flyweight",
  bantam: "bantamweight",
  coq: "bantamweight",
  feather: "featherweight",
  plume: "featherweight",
  light: "lightweight",
  leger: "lightweight",
  lightheavy: "light_heavyweight",
  milourd: "light_heavyweight",
  welter: "welterweight",
  mimoyen: "welterweight",
  middle: "middleweight",
  moyen: "middleweight",
  heavy: "heavyweight",
  lourd: "heavyweight",
};

function normalizeLabel(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // retire les accents (diacritiques combines)
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

export function resolveWeightClassId(label: string, gender: "male" | "female"): string | null {
  const normalized = normalizeLabel(label);
  const genderPrefix = gender === "male" ? "m" : "f";

  // "light heavyweight"/"mi-lourd" doivent matcher avant "lightweight"/"leger" (sous-chaine).
  const orderedKeys = Object.keys(WEIGHT_CLASS_ALIASES).sort((a, b) => b.length - a.length);
  for (const key of orderedKeys) {
    if (normalized.includes(key)) {
      const candidateId = `${genderPrefix}_${WEIGHT_CLASS_ALIASES[key]}`;
      if (WEIGHT_CLASSES.some((w) => w.id === candidateId)) return candidateId;
    }
  }
  return null;
}

/** Valide un tableau brut (ex: sorti d'un JSON fourni par l'utilisateur), journalise les erreurs, ignore les entrees invalides. */
export function validateRealRoster(raw: unknown[]): RealFighterRecord[] {
  const valid: RealFighterRecord[] = [];
  raw.forEach((entry, i) => {
    const result = RealFighterRecordSchema.safeParse(entry);
    if (result.success) {
      valid.push(result.data);
    } else {
      console.warn(`[realRoster] Entree ${i} invalide, ignoree:`, result.error.issues);
    }
  });
  return valid;
}
