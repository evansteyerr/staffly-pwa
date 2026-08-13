"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCareerStore } from "@/store/careerStore";
import { FighterHeader } from "@/components/fighter/FighterHeader";
import { ContractOffers } from "@/components/career/ContractOffers";
import { EventScreen } from "@/components/events/EventScreen";
import { CampScreen } from "@/components/fight/CampScreen";
import { FightResult } from "@/components/fight/FightResult";
import { Button } from "@/components/ui/Button";

export default function CareerPage() {
  const router = useRouter();
  const career = useCareerStore((s) => s.career);
  const advance = useCareerStore((s) => s.advance);

  useEffect(() => {
    if (!career) {
      router.replace("/new-career");
    } else if (career.retired) {
      router.replace("/retirement");
    }
  }, [career, router]);

  if (!career || career.retired) return null;

  const idle = !career.activeEvent && !career.pendingFight && career.pendingOffers.length === 0 && !career.lastFightResult;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 py-6">
      <FighterHeader career={career} />

      <div className="text-center text-xs text-muted">
        {new Date(career.worldDate).toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}
      </div>

      {career.lastFightResult ? (
        <FightResult career={career} />
      ) : career.activeEvent ? (
        <EventScreen event={career.activeEvent} />
      ) : career.pendingFight ? (
        <CampScreen career={career} />
      ) : career.pendingOffers.length > 0 ? (
        <ContractOffers offers={career.pendingOffers} />
      ) : (
        idle && <Button onClick={advance}>Continuer</Button>
      )}
    </main>
  );
}
