"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCareerStore } from "@/store/careerStore";
import { Button } from "@/components/ui/Button";
import { ChoiceCard } from "@/components/ui/Card";
import { NATIONALITIES, getNationality } from "@/data/names";
import { STYLES } from "@/data/creation/styles";
import { ORIGINS } from "@/data/creation/origins";
import { LIFESTYLES } from "@/data/creation/lifestyles";
import { ENTOURAGES } from "@/data/creation/entourages";
import { weightClassesForGender } from "@/data/organizations/weightClasses";
import type { Gender, StyleId, OriginId, LifestyleId, EntourageId } from "@/types";

const STEPS = ["nationalite", "identite", "categorie", "style", "origine", "mode_de_vie", "entourage", "resume"] as const;
type Step = (typeof STEPS)[number];

export default function NewCareerPage() {
  const router = useRouter();
  const startCareer = useCareerStore((s) => s.startCareer);

  const [stepIndex, setStepIndex] = useState(0);
  const step: Step = STEPS[stepIndex];

  const [nationalityCode, setNationalityCode] = useState("FR");
  const [gender, setGender] = useState<Gender>("male");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [weightClassId, setWeightClassId] = useState("m_lightweight");
  const [styleId, setStyleId] = useState<StyleId>("modern_mma");
  const [originId, setOriginId] = useState<OriginId>("hard_neighborhood");
  const [lifestyleId, setLifestyleId] = useState<LifestyleId>("balanced");
  const [entourageId, setEntourageId] = useState<EntourageId>("family");

  const weightClasses = useMemo(() => weightClassesForGender(gender), [gender]);

  function randomizeName() {
    const nat = getNationality(nationalityCode);
    const pool = gender === "male" ? nat.male : nat.female;
    setFirstName(pool[Math.floor(Math.random() * pool.length)]);
    setLastName(nat.surnames[Math.floor(Math.random() * nat.surnames.length)]);
  }

  function next() {
    setStepIndex((i) => Math.min(STEPS.length - 1, i + 1));
  }
  function back() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function canProceed(): boolean {
    if (step === "identite") return firstName.trim().length > 0 && lastName.trim().length > 0;
    return true;
  }

  function handleCreate() {
    const seed = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    startCareer({
      seed,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender,
      nationalityCode,
      weightClassId,
      birthYearsAgo: 19,
      creationChoices: { styleId, originId, lifestyleId, entourageId },
    });
    router.push("/career");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-8">
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className={`h-1 flex-1 rounded-full ${i <= stepIndex ? "bg-accent-gold" : "bg-surface-2"}`} />
        ))}
      </div>

      {step === "nationalite" && (
        <StepBlock title="Nationalite" subtitle="D'ou vient ton combattant ?">
          <div className="grid grid-cols-2 gap-2">
            {NATIONALITIES.map((n) => (
              <ChoiceCard
                key={n.code}
                onClick={() => setNationalityCode(n.code)}
                className={nationalityCode === n.code ? "border-accent-gold" : ""}
              >
                <span className="text-lg">{n.flag}</span> <span className="text-sm">{n.label}</span>
              </ChoiceCard>
            ))}
          </div>
        </StepBlock>
      )}

      {step === "identite" && (
        <StepBlock title="Identite" subtitle="Choisis un nom, ou laisse le hasard decider.">
          <div className="flex gap-2">
            <button
              onClick={() => setGender("male")}
              className={`flex-1 rounded-xl border p-3 text-sm ${gender === "male" ? "border-accent-gold bg-surface-2" : "border-border bg-surface"}`}
            >
              Homme
            </button>
            <button
              onClick={() => setGender("female")}
              className={`flex-1 rounded-xl border p-3 text-sm ${gender === "female" ? "border-accent-gold bg-surface-2" : "border-border bg-surface"}`}
            >
              Femme
            </button>
          </div>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Prenom"
            className="rounded-xl border border-border bg-surface-2 p-3 text-sm outline-none focus:border-accent-gold"
          />
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Nom"
            className="rounded-xl border border-border bg-surface-2 p-3 text-sm outline-none focus:border-accent-gold"
          />
          <Button variant="ghost" onClick={randomizeName} type="button">
            🎲 Nom aleatoire
          </Button>
        </StepBlock>
      )}

      {step === "categorie" && (
        <StepBlock title="Categorie de poids" subtitle="Dans quelle categorie vas-tu te battre ?">
          <div className="flex flex-col gap-2">
            {weightClasses.map((wc) => (
              <ChoiceCard
                key={wc.id}
                onClick={() => setWeightClassId(wc.id)}
                className={weightClassId === wc.id ? "border-accent-gold" : ""}
              >
                <div className="text-sm font-semibold">{wc.label}</div>
                <div className="text-xs text-muted">jusqu&apos;a {wc.maxWeightKg} kg</div>
              </ChoiceCard>
            ))}
          </div>
        </StepBlock>
      )}

      {step === "style" && (
        <StepBlock title="Style de base" subtitle="Ton bagage martial de depart.">
          <div className="flex flex-col gap-2">
            {STYLES.map((s) => (
              <ChoiceCard key={s.id} onClick={() => setStyleId(s.id)} className={styleId === s.id ? "border-accent-gold" : ""}>
                <div className="text-sm font-semibold">
                  {s.emoji} {s.label}
                </div>
                <div className="text-xs text-muted">{s.flavor}</div>
              </ChoiceCard>
            ))}
          </div>
        </StepBlock>
      )}

      {step === "origine" && (
        <StepBlock title="Origine" subtitle="D'ou viens-tu, avant tout ça ?">
          <div className="flex flex-col gap-2">
            {ORIGINS.map((o) => (
              <ChoiceCard key={o.id} onClick={() => setOriginId(o.id)} className={originId === o.id ? "border-accent-gold" : ""}>
                <div className="text-sm font-semibold">
                  {o.emoji} {o.label}
                </div>
                <div className="text-xs text-muted">{o.flavor}</div>
              </ChoiceCard>
            ))}
          </div>
        </StepBlock>
      )}

      {step === "mode_de_vie" && (
        <StepBlock title="Mode de vie" subtitle="Comment vis-tu, en dehors de la salle ?">
          <div className="flex flex-col gap-2">
            {LIFESTYLES.map((l) => (
              <ChoiceCard key={l.id} onClick={() => setLifestyleId(l.id)} className={lifestyleId === l.id ? "border-accent-gold" : ""}>
                <div className="text-sm font-semibold">
                  {l.emoji} {l.label}
                </div>
                <div className="text-xs text-muted">{l.flavor}</div>
              </ChoiceCard>
            ))}
          </div>
        </StepBlock>
      )}

      {step === "entourage" && (
        <StepBlock title="Entourage" subtitle="Qui t'accompagne dans cette aventure ?">
          <div className="flex flex-col gap-2">
            {ENTOURAGES.map((e) => (
              <ChoiceCard key={e.id} onClick={() => setEntourageId(e.id)} className={entourageId === e.id ? "border-accent-gold" : ""}>
                <div className="text-sm font-semibold">
                  {e.emoji} {e.label}
                </div>
                <div className="text-xs text-muted">{e.flavor}</div>
              </ChoiceCard>
            ))}
          </div>
        </StepBlock>
      )}

      {step === "resume" && (
        <StepBlock title="Pret ?" subtitle="Verifie ton combattant avant de commencer.">
          <div className="rounded-xl border border-border bg-surface-2 p-4 text-sm">
            <div className="font-semibold">
              {firstName} {lastName}
            </div>
            <div className="text-muted">
              {getNationality(nationalityCode).flag} {getNationality(nationalityCode).label} ·{" "}
              {weightClasses.find((w) => w.id === weightClassId)?.label}
            </div>
            <div className="mt-2 text-xs text-muted">
              {STYLES.find((s) => s.id === styleId)?.label} · {ORIGINS.find((o) => o.id === originId)?.label} ·{" "}
              {LIFESTYLES.find((l) => l.id === lifestyleId)?.label} · {ENTOURAGES.find((e) => e.id === entourageId)?.label}
            </div>
          </div>
          <Button onClick={handleCreate}>Commencer la carriere</Button>
        </StepBlock>
      )}

      <div className="mt-auto flex gap-3 pt-4">
        {stepIndex > 0 && (
          <Button variant="secondary" onClick={back}>
            Retour
          </Button>
        )}
        {step !== "resume" && (
          <Button onClick={next} disabled={!canProceed()}>
            Suivant
          </Button>
        )}
      </div>
    </main>
  );
}

function StepBlock({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-muted">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
