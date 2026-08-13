"use client";

import type { ContractOffer } from "@/types";
import { getOrganization } from "@/data/organizations";
import { useCareerStore } from "@/store/careerStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

function Stars({ count }: { count: number }) {
  return <span className="text-accent-gold">{"★".repeat(count)}{"☆".repeat(5 - count)}</span>;
}

export function ContractOffers({ offers }: { offers: ContractOffer[] }) {
  const acceptOffer = useCareerStore((s) => s.acceptOffer);
  const skipOffers = useCareerStore((s) => s.skipOffers);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-bold">Propositions de contrat</h2>
        <p className="text-sm text-muted">Aucun chemin n&apos;est objectivement meilleur qu&apos;un autre.</p>
      </div>
      {offers.map((offer) => {
        const org = getOrganization(offer.organizationId);
        return (
          <Card key={offer.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold">{org.name}</span>
              <span className="text-xs uppercase text-muted">{org.tier}</span>
            </div>
            <div className="text-sm text-muted">{offer.fights} combats</div>
            <div className="text-sm">
              {offer.guaranteed ? (
                <span>{offer.guaranteed.toLocaleString("fr-FR")} € garantis</span>
              ) : (
                <span>
                  {offer.showMoney.toLocaleString("fr-FR")} € / combat + {offer.winBonus.toLocaleString("fr-FR")} € victoire
                </span>
              )}
            </div>
            <div className="flex justify-between text-xs">
              <span>
                Prestige <Stars count={offer.prestigeStars} />
              </span>
              <span>
                Opposition <Stars count={offer.oppositionStars} />
              </span>
            </div>
            <Button onClick={() => acceptOffer(offer)}>Signer</Button>
          </Card>
        );
      })}
      <Button variant="ghost" onClick={skipOffers}>
        Attendre d&apos;autres propositions
      </Button>
    </div>
  );
}
