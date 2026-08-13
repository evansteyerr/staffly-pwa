"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCareerStore } from "@/store/careerStore";
import { FighterHeader } from "@/components/fighter/FighterHeader";
import { ContractOffers } from "@/components/career/ContractOffers";
import { EventScreen } from "@/components/events/EventScreen";
import { EventOutcomeScreen } from "@/components/events/EventOutcomeScreen";
import { CampScreen } from "@/components/fight/CampScreen";
import { FightResult } from "@/components/fight/FightResult";
import { Button } from "@/components/ui/Button";

export default function CareerPage() {
  const router = useRouter();
  const career = useCareerStore((s) => s.career);
  const advance = useCareerStore((s) => s.advance);
  const hasHydrated = useCareerStore((s) => s.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!career) {
      router.replace("/new-career");
    } else if (career.retired) {
      router.replace("/retirement");
    }
  }, [career, hasHydrated, router]);

  if (!hasHydrated || !career || career.retired) return null;

  const idle =
    !career.activeEvent &&
    !career.pendingFight &&
    career.pendingOffers.length === 0 &&
    !career.lastFightResult &&
    !career.lastEventOutcome;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 py-6">
      <FighterHeader career={career} />

      <div className="flex items-center justify-between text-xs text-muted">
        <span>{new Date(career.worldDate).toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}</span>
        {career.fighter.organizationId && (
          <Link href="/rankings" className="font-semibold text-accent-gold hover:underline">
            Voir le classement →
          </Link>
        )}
      </div>

      {career.lastEventOutcome ? (
        <EventOutcomeScreen outcome={career.lastEventOutcome} />
      ) : career.lastFightResult ? (
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
