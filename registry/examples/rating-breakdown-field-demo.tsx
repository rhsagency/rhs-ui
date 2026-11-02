"use client";

import { useState, type ReactNode } from "react";

import { RatingBreakdownField, type RatingAspect, type RatingBreakdownValue } from "@rhs-ui/primitives/rating-breakdown-field";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const STAY: readonly RatingAspect[] = [
  { id: "cleanliness", label: "Cleanliness", description: "The room, the bathroom and the shared spaces.", required: true },
  { id: "location", label: "Location", description: "How easy it was to get to the sights and the station.", required: true },
  { id: "value", label: "Value for money", required: true },
  { id: "staff", label: "Staff" },
  { id: "breakfast", label: "Breakfast", description: "Leave it if you did not have any." },
];

const SELLER: readonly RatingAspect[] = [
  { id: "communication", label: "Communication", required: true },
  { id: "shipping", label: "Shipping speed", required: true },
  { id: "accuracy", label: "Item as described", required: true },
  { id: "packaging", label: "Packaging" },
];

function Stay(): React.JSX.Element {
  const [answers, setAnswers] = useState<RatingBreakdownValue>({ cleanliness: 4, location: 5, staff: 4 });
  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="rounded-xl border border-border bg-card p-5 shadow-xs">
      <RatingBreakdownField
        aspects={STAY}
        value={answers}
        onValueChange={setAnswers}
        label="How was your stay at Hotel Halcyon?"
        description="Rate each part on its own, and tick Not applicable for what you did not use."
        name="stay"
      />
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <Example caption="Try it: use the arrow keys on a row, or tick Not applicable. Value is still needed">
        <Stay />
      </Example>
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Every required row answered, one marked Not applicable: the average of what is rated">
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <RatingBreakdownField aspects={SELLER} label="Rate the seller, Kestrel Outdoor" defaultValue={{ communication: 5, shipping: 4, accuracy: 4, packaging: null }} />
          </div>
        </Example>
        <Example caption="Nothing rated yet">
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <RatingBreakdownField aspects={SELLER.slice(0, 3)} label="Rate the seller" />
          </div>
        </Example>
      </div>
    </div>
  );
}
