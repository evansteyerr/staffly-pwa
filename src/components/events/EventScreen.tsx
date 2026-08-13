"use client";

import type { ActiveEvent } from "@/types";
import { useCareerStore } from "@/store/careerStore";
import { ChoiceCard } from "@/components/ui/Card";

const CATEGORY_ICONS: Record<string, string> = {
  training: "🥊",
  money: "💰",
  family: "👨‍👩‍👦",
  friendship: "🤝",
  coach: "🧑‍🏫",
  manager: "🦈",
  media: "🎥",
  rivalry: "🔥",
  injury: "🩹",
  contract: "📄",
  sponsor: "🤝",
  social_media: "📱",
  mental: "🧠",
  weight: "⚖️",
  fame: "🌟",
  scandal: "⚠️",
  opportunity: "✨",
  retirement: "🕊️",
  fight_offer: "🥋",
};

export function EventScreen({ event }: { event: ActiveEvent }) {
  const chooseEvent = useCareerStore((s) => s.chooseEvent);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="mb-2 text-2xl">{CATEGORY_ICONS[event.template.category] ?? "🎯"}</div>
        <h2 className="text-lg font-bold leading-snug">{event.renderedTitle}</h2>
        <p className="mt-2 text-sm text-muted">{event.renderedDescription}</p>
      </div>

      <div className="flex flex-col gap-2">
        {event.template.choices.map((choice) => (
          <ChoiceCard key={choice.id} onClick={() => chooseEvent(choice.id)}>
            <div className="text-sm font-semibold">{choice.label}</div>
            {choice.flavor && <div className="mt-1 text-xs italic text-muted">{choice.flavor}</div>}
          </ChoiceCard>
        ))}
      </div>
    </div>
  );
}
