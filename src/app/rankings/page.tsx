"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCareerStore } from "@/store/careerStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getOrganization } from "@/data/organizations";
import { getWeightClass } from "@/data/organizations/weightClasses";

export default function RankingsPage() {
  const router = useRouter();
  const career = useCareerStore((s) => s.career);
  const hasHydrated = useCareerStore((s) => s.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!career) router.replace("/");
  }, [career, hasHydrated, router]);

  if (!hasHydrated || !career) return null;

  const { fighter, worldState } = career;

  if (!fighter.organizationId) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 py-8">
        <h1 className="text-xl font-black">Classement</h1>
        <p className="text-sm text-muted">Signe un contrat avec une organisation pour voir son classement.</p>
        <Button variant="secondary" onClick={() => router.back()}>
          Retour
        </Button>
      </main>
    );
  }

  const org = getOrganization(fighter.organizationId);
  const wc = getWeightClass(fighter.weightClass);
  const board = worldState.rankings.find(
    (r) => r.organizationId === fighter.organizationId && r.weightClassId === fighter.weightClass,
  );
  const champion = board?.championId ? worldState.fighters[board.championId] : null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 py-8">
      <div>
        <div className="text-xs uppercase tracking-widest text-accent-gold">{org.name}</div>
        <h1 className="text-xl font-black">Classement — {wc.label}</h1>
      </div>

      {champion && (
        <Card className={`border-accent-gold ${champion.id === fighter.id ? "ring-2 ring-accent-gold" : ""}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-accent-gold">🏆 Champion</div>
              <div className="font-bold">
                {champion.firstName} {champion.lastName}
                {champion.id === fighter.id && <span className="ml-2 text-xs text-accent-gold">(toi)</span>}
              </div>
            </div>
            <div className="text-sm text-muted">
              {champion.record.wins}-{champion.record.losses}-{champion.record.draws}
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-1.5">
        {board && board.top15.length > 0 ? (
          board.top15.map((entry, i) => {
            const f = worldState.fighters[entry.fighterId];
            if (!f) return null;
            const isPlayer = f.id === fighter.id;
            return (
              <div
                key={entry.fighterId}
                className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm ${
                  isPlayer ? "border-accent-gold bg-surface-2" : "border-border bg-surface"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-muted">#{i + 1}</span>
                  <span className={isPlayer ? "font-bold text-accent-gold" : "font-medium"}>
                    {f.firstName} {f.lastName}
                    {isPlayer && " (toi)"}
                  </span>
                </div>
                <span className="text-muted">
                  {f.record.wins}-{f.record.losses}-{f.record.draws}
                </span>
              </div>
            );
          })
        ) : (
          <p className="text-center text-sm text-muted">Aucun combattant classe pour le moment.</p>
        )}
      </div>

      {!champion && (!board || board.top15.every((e) => e.fighterId !== fighter.id)) && (
        <p className="text-center text-xs text-muted">
          Tu n&apos;es pas encore classe — il faut prouver ta valeur dans la cage avant d&apos;apparaitre ici.
        </p>
      )}

      <Button variant="secondary" onClick={() => router.back()}>
        Retour
      </Button>
    </main>
  );
}
