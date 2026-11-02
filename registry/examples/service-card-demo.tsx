"use client";

import { useState, type ReactNode } from "react";

import { ServiceCard } from "@rhs-ui/application/service-card";

function Case({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col">
      <p className="mb-2.5 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [picked, setPicked] = useState<string | null>("signature");
  const pick = (id: string) => (next: boolean) => setPicked(next ? id : null);

  return (
    <div className="grid w-full max-w-4xl gap-x-6 gap-y-8 md:grid-cols-2">
      <Case caption="Pick one: the whole card is the button.">
        <ServiceCard
          name="Signature cut"
          description="A wash, a cut and a finish with a stylist who listens before the scissors come out."
          duration={45}
          price={60}
          badge="Most booked"
          includes={["Consultation", "Wash and scalp massage", "Cut and blow-dry"]}
          selected={picked === "signature"}
          onSelect={pick("signature")}
          className="flex-1"
        />
      </Case>

      <Case caption="With variants it says from, and counts the options.">
        <ServiceCard
          name="Colour and tone"
          description="A root touch-up, a gloss or a full change of colour, mixed for your hair."
          duration={90}
          price={85}
          priceFrom
          options={3}
          includes={["Colour consultation", "Toner and gloss", "Bond-repair treatment"]}
          selected={picked === "colour"}
          onSelect={pick("colour")}
          className="flex-1"
        />
      </Case>

      <Case caption="Unavailable: it says why, and the action stays disabled.">
        <ServiceCard
          name="Deep conditioning"
          description="A thirty minute mask and steam for dry or damaged hair."
          duration={30}
          price={35}
          includes={["Mask matched to your hair", "Steam and rinse"]}
          unavailable="Fully booked until 14 Nov. Try the Signature cut instead."
          selected={picked === "conditioning"}
          onSelect={pick("conditioning")}
          className="flex-1"
        />
      </Case>

      <Case caption="With a link instead of a handler, the action is Book.">
        <ServiceCard
          name="Bridal trial"
          description="A full run of your wedding look, with time to change your mind."
          duration="Half a day"
          price="On request"
          includes={["Two stylists", "Photos of the finished look", "Refreshments"]}
          href="#bridal-trial"
          className="flex-1"
        />
      </Case>

      <p role="status" className="min-h-4 text-xs text-muted-foreground md:col-span-2">
        {picked ? `Picked: ${{ signature: "Signature cut", colour: "Colour and tone", conditioning: "Deep conditioning" }[picked] ?? picked}.` : "Nothing picked yet."}
      </p>
    </div>
  );
}
