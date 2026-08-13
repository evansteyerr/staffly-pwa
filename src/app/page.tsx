"use client";

import Link from "next/link";
import { useCareerStore } from "@/store/careerStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BRANDING } from "@/config/branding";

export default function Home() {
  const career = useCareerStore((s) => s.career);
  const pantheonCount = useCareerStore((s) => s.pantheon.length);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-between gap-8 px-5 py-10">
      <div className="text-center">
        <div className="mb-2 text-xs uppercase tracking-[0.3em] text-accent-gold">MMA Career</div>
        <h1 className="text-4xl font-black tracking-tight">{BRANDING.gameName}</h1>
        <p className="mt-3 text-sm text-muted">{BRANDING.tagline}</p>
      </div>

      <div className="flex flex-col gap-3">
        {career && !career.retired ? (
          <Link href="/career">
            <Button variant="primary">Continuer ta carriere</Button>
          </Link>
        ) : null}
        <Link href="/new-career">
          <Button variant={career && !career.retired ? "secondary" : "primary"}>
            {career ? "Nouvelle carriere" : "Commencer une carriere"}
          </Button>
        </Link>
        <Link href="/pantheon">
          <Card className="flex items-center justify-between text-sm hover:border-accent-gold transition-colors">
            <span>👑 Pantheon</span>
            <span className="text-muted">{pantheonCount} carriere{pantheonCount > 1 ? "s" : ""}</span>
          </Card>
        </Link>
      </div>

      <p className="text-center text-xs text-muted">
        Univers et combattants simules. Les noms d&apos;organisations (UFC, KSW, PFL, Cage Warriors...) sont utilises a
        titre indicatif ; roster, classements et statistiques sont entierement fictifs et sans lien officiel.
      </p>
    </main>
  );
}
