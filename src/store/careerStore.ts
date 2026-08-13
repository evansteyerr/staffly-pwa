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
  startCareer: (input: NewCareerInput) => void;
  advance: () => void;
  chooseEvent: (choiceId: string) => void;
  acceptOffer: (offer: ContractOffer) => void;
  skipOffers: () => void;
  fight: (gameplan: Gameplan, campFocus: CampFocus) => void;
  declineFight: () => void;
  abandonCareer: () => void;
  clearFightResult: () => void;
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

      abandonCareer: () => set({ career: null }),
    }),
    {
      name: "cage-legacy:v1",
      partialize: (state) => ({ career: state.career, pantheon: state.pantheon }),
    },
  ),
);
