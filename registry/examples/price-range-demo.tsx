import type { ReactNode } from "react";

import { PriceRange } from "@rhs-ui/commerce/price-range";

function Card({ name, note, hint, children }: { name: string; note: string; hint: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid content-start gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
      <div>
        <h2 className="text-sm font-medium">{name}</h2>
        <p className="text-xs text-muted-foreground">{note}</p>
      </div>
      <div className="text-lg tracking-[-0.02em]">{children}</div>
      <code className="font-mono text-[0.6875rem] break-words text-muted-foreground">{hint}</code>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl min-w-0 gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,13.5rem),1fr))]">
      <Card name="Halcyon pendant" note="One size, one price" hint="min={12900}">
        <PriceRange min={12900} locale="en-GB" />
      </Card>
      <Card name="Linen cushion" note="Three sizes" hint="min={2900} max={5900}">
        <PriceRange min={2900} max={5900} locale="en-GB" />
      </Card>
      <Card name="Linen cushion" note="The same, as a range" hint='variant="range"'>
        <PriceRange min={2900} max={5900} variant="range" locale="en-GB" />
      </Card>
      <Card name="Arc table lamp" note="Two finishes, on sale" hint="compareAtMin and compareAtMax">
        <PriceRange min={10400} max={12900} compareAtMin={12900} compareAtMax={15900} variant="range" locale="en-GB" />
      </Card>
      <Card name="Chef's knife" note="Cents show when a figure has them" hint="min={4950} max={8950}">
        <PriceRange min={4950} max={8950} locale="en-GB" />
      </Card>
      <Card name="Linnen kussen" note="Dutch, with its own words" hint='locale="nl-NL" labels={{ from }}'>
        <PriceRange min={2900} max={5900} locale="nl-NL" labels={{ from: "Vanaf" }} />
      </Card>
    </div>
  );
}
