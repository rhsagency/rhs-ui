"use client";

import { useState, type ReactNode } from "react";

import { WeightedScorecard, type ScorecardCriterion, type ScorecardOption, type ScorecardScores } from "@rhs-ui/dashboard/weighted-scorecard";

const vendors: ScorecardOption[] = [
  { id: "northwind", name: "Northwind" },
  { id: "halcyon", name: "Halcyon" },
  { id: "kestrel", name: "Kestrel" },
];
const needs: ScorecardCriterion[] = [
  { id: "price", label: "Price", weight: 30, description: "Total cost over three years for 25 seats" },
  { id: "integrations", label: "Integrations", weight: 25, description: "Billing, email and the data warehouse" },
  { id: "ease", label: "Ease of use", weight: 20, description: "How long a new hire takes to be productive" },
  { id: "support", label: "Support", weight: 15, description: "Response time and a named contact" },
  { id: "security", label: "Security", weight: 10, description: "SSO, an audit log and EU data residency" },
];
const vendorScores: ScorecardScores = {
  price: { northwind: 4, halcyon: 3, kestrel: 5 },
  integrations: { northwind: 5, halcyon: 4, kestrel: 3 },
  ease: { northwind: 4, halcyon: 5, kestrel: 3 },
  support: { northwind: 3, halcyon: 4, kestrel: 4 },
  security: { northwind: 5, halcyon: 4, kestrel: 3 },
};

const studios: ScorecardOption[] = [
  { id: "oakline", name: "Oakline" },
  { id: "polder", name: "Polder" },
  { id: "lumen", name: "Lumen" },
];
const studioNeeds: ScorecardCriterion[] = [
  { id: "craft", label: "Craft", weight: 40, description: "The quality of the three case studies they sent" },
  { id: "strategy", label: "Strategy", weight: 25, description: "Whether they questioned the brief" },
  { id: "timeline", label: "Timeline", weight: 20, description: "Can they start in November?" },
  { id: "budget", label: "Budget fit", weight: 15, description: "Their quote against our 45,000 euro ceiling" },
];
const studioScores: ScorecardScores = {
  craft: { oakline: 9, polder: 8, lumen: 10 },
  strategy: { oakline: 7, polder: 9, lumen: 6 },
  timeline: { oakline: 10, polder: 7, lumen: 8 },
  budget: { oakline: 6, polder: 8, lumen: 5 },
};

const offices: ScorecardOption[] = [
  { id: "utrecht", name: "Utrecht" },
  { id: "rotterdam", name: "Rotterdam" },
];
const officeNeeds: ScorecardCriterion[] = [
  { id: "commute", label: "Commute", weight: 3 },
  { id: "cost", label: "Rent per desk", weight: 2 },
  { id: "space", label: "Room to grow", weight: 1 },
];
const officeScores: ScorecardScores = {
  commute: { utrecht: 4, rotterdam: 3 },
  cost: { utrecht: 3, rotterdam: 5 },
  space: { utrecht: 5, rotterdam: 4 },
};

const draftScores: ScorecardScores = {
  commute: { utrecht: 4, rotterdam: 3 },
  cost: { utrecht: 3 },
  space: { utrecht: 5, rotterdam: 4 },
};

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="min-w-0">
      <p className="mb-3 text-xs text-muted-foreground">{caption}</p>
      {children}
    </section>
  );
}

export default function Demo(): React.JSX.Element {
  const [scores, setScores] = useState<ScorecardScores>(vendorScores);

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-12 px-4 py-10 sm:px-6">
      <Example caption="Which support tool do we buy? Change a score and the totals follow.">
        <WeightedScorecard
          caption="Support tools scored against what we need"
          criteria={needs}
          options={vendors}
          scores={scores}
          onScoreChange={(criterion, option, score) => setScores((current) => ({ ...current, [criterion]: { ...current[criterion], [option]: score } }))}
        />
      </Example>

      <Example caption="A longer scale: max is 10, so every score runs from 1 to 10">
        <WeightedScorecard caption="Studios scored for the storefront redesign" criteria={studioNeeds} options={studios} defaultScores={studioScores} max={10} />
      </Example>

      <Example caption="Read only, and a tie is called a tie">
        <WeightedScorecard caption="Office locations scored" criteria={officeNeeds} options={offices} scores={officeScores} readOnly />
      </Example>

      <Example caption="A cell is empty: nobody leads until it is filled in">
        <WeightedScorecard caption="Office locations, still being scored" criteria={officeNeeds} options={offices} defaultScores={draftScores} />
      </Example>
    </div>
  );
}
