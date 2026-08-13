"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCareerStore } from "@/store/careerStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getNationality } from "@/data/names";
import { getWeightClass } from "@/data/organizations/weightClasses";
import { ageFromDob } from "@/game/fighter/generate";
import { computeLegacy, LEGACY_CLASSES } from "@/game/legacy/score";

export default function RetirementPage() {
  const router = useRouter();
  const career = useCareerStore((s) => s.career);
  const abandonCareer = useCareerStore((s) => s.abandonCareer);

  useEffect(() => {
    if (!career) router.replace("/");
    else if (!career.retired) router.replace("/career");
  }, [career, router]);

  if (!career || !career.retired) return null;

  const { fighter } = career;
  const nat = getNationality(fighter.nationality);
  const wc = getWeightClass(fighter.weightClass);
  const retirementAge = ageFromDob(fighter.dateOfBirth, career.worldDate);
  const legacyClassInfo = LEGACY_CLASSES.find((c) => c.id === career.legacyClass) ?? LEGACY_CLASSES[0];
  const breakdown = computeLegacy(career);

  const bestWin = [...career.fightHistory]
    .filter((f) => f.result === "win")
    .sort((a, b) => b.fight.fightImportanceScore - a.fight.fightImportanceScore)[0];
  const worstLoss = [...career.fightHistory].filter((f) => f.result === "loss")[0];

  function handleNewCareer() {
    abandonCareer();
    router.push("/new-career");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 py-8">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full border-2 border-accent-gold bg-surface-2 text-2xl font-black">
          {fighter.firstName[0]}
          {fighter.lastName[0]}
        </div>
        <h1 className="text-2xl font-black">
          {fighter.firstName} {fighter.lastName}
        </h1>
        {fighter.nickname && <div className="italic text-accent-gold">&ldquo;{fighter.nickname}&rdquo;</div>}
        <div className="mt-1 text-sm text-muted">
          {nat.flag} {nat.label} · {wc.label} · retraite a {retirementAge} ans
        </div>
      </div>

      <Card className="border-accent-gold text-center">
        <div className="text-xs uppercase tracking-widest text-muted">Legacy Score</div>
        <div className="text-4xl font-black text-accent-gold">{career.legacyScore}</div>
        <div className="mt-1 text-sm font-semibold">{legacyClassInfo.label}</div>
      </Card>

      <Card>
        <p className="text-sm italic leading-relaxed text-foreground">&ldquo;{career.epilogue}&rdquo;</p>
      </Card>

      <div className="grid grid-cols-3 gap-2 text-center">
        <StatBox label="Record" value={`${fighter.record.wins}-${fighter.record.losses}-${fighter.record.draws}`} />
        <StatBox label="KO/TKO" value={String(fighter.record.winsByKo)} />
        <StatBox label="Soumissions" value={String(fighter.record.winsBySub)} />
        <StatBox label="Titres" value={String(career.titles.length)} />
        <StatBox label="Defenses" value={String(career.titles.reduce((s, t) => s + t.defenses, 0))} />
        <StatBox label="Gains" value={`${career.finances.careerEarnings.toLocaleString("fr-FR")} €`} />
      </div>

      <Card>
        <h3 className="mb-2 text-sm font-semibold text-muted">Detail du Legacy</h3>
        <div className="flex flex-col gap-1 text-xs text-muted">
          <Row label="Victoires" value={Math.round(breakdown.fromWins)} />
          <Row label="Finitions" value={Math.round(breakdown.fromFinishes)} />
          <Row label="Titres" value={Math.round(breakdown.fromTitles)} />
          <Row label="Distinctions" value={Math.round(breakdown.fromAwards)} />
          <Row label="Longevite" value={Math.round(breakdown.fromLongevity)} />
          <Row label="Popularite" value={Math.round(breakdown.fromPopularity)} />
        </div>
      </Card>

      {(bestWin || worstLoss) && (
        <Card>
          <h3 className="mb-2 text-sm font-semibold text-muted">Moments marquants</h3>
          {bestWin && (
            <div className="text-xs">
              <span className="text-emerald-500">Meilleure victoire : </span>
              {bestWin.opponentName} ({bestWin.fight.method})
            </div>
          )}
          {worstLoss && (
            <div className="mt-1 text-xs">
              <span className="text-accent-red-bright">Pire defaite : </span>
              {worstLoss.opponentName} ({worstLoss.fight.method})
            </div>
          )}
        </Card>
      )}

      <Card>
        <h3 className="mb-2 text-sm font-semibold text-muted">Timeline de carriere</h3>
        <div className="flex flex-col gap-2">
          {career.careerHistory.map((m) => (
            <div key={m.id} className="text-xs">
              <span className="text-muted">{new Date(m.date).getFullYear()} — </span>
              <span className="font-semibold">{m.label}</span>
              <div className="text-muted">{m.detail}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        <Button onClick={() => router.push("/pantheon")}>Voir le Pantheon</Button>
        <Button variant="secondary" onClick={handleNewCareer}>
          Nouvelle carriere
        </Button>
      </div>
    </main>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-2">
      <div className="text-sm font-bold">{value}</div>
      <div className="text-[10px] uppercase text-muted">{label}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
