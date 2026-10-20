"use client";

import { useState, type ReactNode } from "react";

import { ModifierGroup } from "@rhs-ui/commerce/modifier-group";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [pastry, setPastry] = useState<string[]>([]);
  const shared = { currency: "EUR", locale: "en-GB" } as const;

  return (
    <div className="grid w-full max-w-4xl items-start gap-x-8 gap-y-9 md:grid-cols-2">
      <Example caption="One choice, required: a check appears once it is satisfied">
        <ModifierGroup
          {...shared}
          title="Size"
          min={1}
          defaultValue={["medium"]}
          options={[
            { id: "small", label: "Small", description: "8 oz" },
            { id: "medium", label: "Medium", description: "12 oz", price: 60 },
            { id: "large", label: "Large", description: "16 oz", price: 120 },
          ]}
        />
      </Example>

      <Example caption="One choice, optional: it can be cleared again">
        <ModifierGroup
          {...shared}
          title="Milk"
          defaultValue={["oat"]}
          options={[
            { id: "whole", label: "Whole milk" },
            { id: "oat", label: "Oat", price: 50 },
            { id: "almond", label: "Almond", price: 50 },
            { id: "soy", label: "Soy", price: 50, disabled: true, note: "Sold out" },
          ]}
        />
      </Example>

      <Example caption="Up to 2: at the maximum the rest lock and say why">
        <ModifierGroup
          {...shared}
          title="Extras"
          max={2}
          defaultValue={["shot", "vanilla"]}
          options={[
            { id: "shot", label: "Extra shot", price: 80 },
            { id: "vanilla", label: "Vanilla syrup", price: 50 },
            { id: "caramel", label: "Caramel drizzle", price: 50 },
            { id: "cream", label: "Whipped cream", price: 40 },
          ]}
        />
      </Example>

      <Example caption="A required group after a failed Add to order">
        <ModifierGroup
          {...shared}
          title="Choose a pastry"
          min={1}
          max={2}
          invalid
          value={pastry}
          onChange={setPastry}
          options={[
            { id: "croissant", label: "Butter croissant", description: "Baked at 7:00", price: 280 },
            { id: "bun", label: "Cardamom bun", price: 320 },
            { id: "financier", label: "Almond financier", price: 250 },
          ]}
        />
      </Example>
    </div>
  );
}
