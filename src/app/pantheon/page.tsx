"use client";

import Link from "next/link";
import { useCareerStore } from "@/store/careerStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getNationality } from "@/data/names";

export default function PantheonPage() {
  const pantheon = useCareerStore((s) => s.pantheon);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 py-8">
      <div className="text-center">
        <div className="text-xs uppercase tracking-widest text-accent-gold">👑 Pantheon</div>
        <h1 className="text-2xl font-black">Carrieres terminees</h1>
      </div>

      {pantheon.length === 0 ? (
        <p className="text-center text-sm text-muted">Aucune carriere terminee pour le moment.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {pantheon
            .slice()
            .sort((a, b) => b.legacyScore - a.legacyScore)
            .map((entry) => {
              const nat = getNationality(entry.nationality);
              return (
                <Card key={entry.careerId} className="border-accent-gold/40">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold">
                        {nat.flag} {entry.fighterName}
                      </div>
                      {entry.nickname && <div className="text-xs italic text-accent-gold">&ldquo;{entry.nickname}&rdquo;</div>}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-accent-gold">{entry.legacyScore}</div>
                      <div className="text-[10px] uppercase text-muted">{entry.legacyClass}</div>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted">
                    <span>{entry.record}</span>
                    <span>{entry.titlesWon} titre{entry.titlesWon > 1 ? "s" : ""}</span>
                    <span>{entry.careerEarnings.toLocaleString("fr-FR")} €</span>
                  </div>
                  {entry.organizations.length > 0 && (
                    <div className="mt-1 text-[10px] text-muted">{entry.organizations.join(" → ")}</div>
                  )}
                </Card>
              );
            })}
        </div>
      )}

      <Link href="/">
        <Button variant="secondary">Retour a l&apos;accueil</Button>
      </Link>
    </main>
  );
}
