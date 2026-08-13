import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CampFocus, CareerState, ContractOffer, Gameplan, PantheonEntry } from "@/types";
import {
  advanceTurn,
  chooseContractOffer,
  createCareer,
  declineOffers,
  declinePendingFight,
  resolveEventChoice,
  resolvePendingFight,
  type NewCareerInput,
} from "@/game/engine/careerEngine";
import { getOrganization } from "@/data/organizations";

interface CareerStoreState {
  career: CareerState | null;
  pantheon: PantheonEntry[];
  /** false tant que la sauvegarde localStorage n'a pas fini de se recharger — evite qu'un refresh direct sur /career, /rankings, etc. rebondisse vers l'accueil avant que la carriere persistee ne soit relue. */
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  startCareer: (input: NewCareerInput) => void;
  advance: () => void;
  chooseEvent: (choiceId: string) => void;
  acceptOffer: (offer: ContractOffer) => void;
  skipOffers: () => void;
  fight: (gameplan: Gameplan, campFocus: CampFocus) => void;
  declineFight: () => void;
  abandonCareer: () => void;
  clearFightResult: () => void;
  clearEventOutcome: () => void;
}

function archiveIfRetired(career: CareerState, pantheon: PantheonEntry[]): PantheonEntry[] {
  if (!career.retired) return pantheon;
  if (pantheon.some((p) => p.careerId === career.careerId)) return pantheon;

  const orgIds = Array.from(new Set(career.fightHistory.map((f) => f.fight.organizationId)));
  const entry: PantheonEntry = {
    careerId: career.careerId,
    seed: career.seed,
    finishedOn: career.retiredOn ?? career.worldDate,
    fighterName: `${career.fighter.firstName} ${career.fighter.lastName}`,
    nickname: career.fighter.nickname,
    nationality: career.fighter.nationality,
    weightClass: career.fighter.weightClass,
    record: `${career.fighter.record.wins}-${career.fighter.record.losses}-${career.fighter.record.draws}`,
    organizations: orgIds.map((id) => getOrganization(id).name),
    titlesWon: career.titles.length,
    legacyScore: career.legacyScore ?? 0,
    legacyClass: career.legacyClass ?? "journeyman",
    careerEarnings: career.finances.careerEarnings,
    epilogue: career.epilogue ?? "",
  };
  return [entry, ...pantheon];
}

export const useCareerStore = create<CareerStoreState>()(
  persist(
    (set, get) => ({
      career: null,
      pantheon: [],
      hasHydrated: false,

      startCareer: (input) => {
        const career = createCareer(input);
        set({ career });
      },

      advance: () => {
        const { career } = get();
        if (!career) return;
        const next = advanceTurn(career);
        set((s) => ({ career: next, pantheon: archiveIfRetired(next, s.pantheon) }));
      },

      chooseEvent: (choiceId) => {
        const { career } = get();
        if (!career) return;
        const next = resolveEventChoice(career, choiceId);
        set((s) => ({ career: next, pantheon: archiveIfRetired(next, s.pantheon) }));
      },

      acceptOffer: (offer) => {
        const { career } = get();
        if (!career) return;
        set({ career: chooseContractOffer(career, offer) });
      },

      skipOffers: () => {
        const { career } = get();
        if (!career) return;
        set({ career: declineOffers(career) });
      },

      fight: (gameplan, campFocus) => {
        const { career } = get();
        if (!career) return;
        const next = resolvePendingFight(career, { gameplan, campFocus });
        set((s) => ({ career: next, pantheon: archiveIfRetired(next, s.pantheon) }));
      },

      declineFight: () => {
        const { career } = get();
        if (!career) return;
        set({ career: declinePendingFight(career) });
      },

      clearFightResult: () => {
        const { career } = get();
        if (!career) return;
        set({ career: { ...career, lastFightResult: null } });
      },

      clearEventOutcome: () => {
        // Ferme l'ecran de resultat ET enchaine directement sur la suite
        // (section 3) : voir le resultat d'un choix ne doit pas couter un
        // clic de plus qu'avant — "Continuer" ici fait a la fois office de
        // fermeture et de tour suivant.
        const { career } = get();
        if (!career) return;
        const cleared = { ...career, lastEventOutcome: null };
        const next = advanceTurn(cleared);
        set((s) => ({ career: next, pantheon: archiveIfRetired(next, s.pantheon) }));
      },

      abandonCareer: () => set({ career: null }),

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "cage-legacy:v1",
      partialize: (state) => ({ career: state.career, pantheon: state.pantheon }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
