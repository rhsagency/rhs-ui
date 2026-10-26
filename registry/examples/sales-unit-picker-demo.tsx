"use client";

import { useState, type ReactNode } from "react";

import { SalesUnitPicker, type SalesUnit, type SalesUnitChange } from "@rhs-ui/commerce/sales-unit-picker";

const pic = (bg: string, body: string) =>
  "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><rect width='120' height='120' fill='${bg}'/>${body}</svg>`);

/** A can of water, drawn flat. */
const CAN = pic(
  "#e4e9ee",
  "<ellipse cx='60' cy='98' rx='24' ry='5' fill='#000' opacity='.12'/><path d='M40 32h40v62a8 8 0 0 1-8 8H48a8 8 0 0 1-8-8z' fill='#5c7388'/><rect x='40' y='52' width='40' height='26' fill='#f2f5f8'/><path d='M48 65h24' stroke='#5c7388' stroke-width='3' stroke-linecap='round'/><rect x='40' y='28' width='40' height='6' rx='3' fill='#aebccb'/>",
);

/** A wedge of aged cheese. */
const CHEESE = pic(
  "#efe9db",
  "<ellipse cx='60' cy='94' rx='34' ry='6' fill='#000' opacity='.1'/><path d='M22 78l52-34 28 20v18a8 8 0 0 1-8 8H30a8 8 0 0 1-8-8z' fill='#d9a441'/><path d='M22 78l52-34 28 20-52 14z' fill='#e7bd63'/><circle cx='62' cy='82' r='4' fill='#c28d2f'/><circle cx='82' cy='76' r='3' fill='#c28d2f'/><circle cx='46' cy='84' r='2.5' fill='#c28d2f'/>",
);

const CANS: readonly SalesUnit[] = [
  { id: "can", label: "Can", pieces: 1, price: 90, min: 6 },
  { id: "tray", label: "Tray of 12", pieces: 12, price: 960 },
  // Nothing left in stock: the card stays in the list, says so, and cannot be chosen.
  { id: "half-pallet", label: "Half pallet of 120", pieces: 120, price: 9000, max: 0 },
  { id: "pallet", label: "Pallet of 240", pieces: 240, price: 16800, max: 4 },
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Product({ picture, name, meta, children }: { picture: string; name: string; meta: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="grid grid-cols-[minmax(0,1fr)] gap-5 rounded-xl border border-border bg-card p-5 shadow-xs" aria-label={name}>
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- a demo picture drawn as a data URI */}
        <img src={picture} alt="" width={48} height={48} className="size-12 shrink-0 rounded-lg border border-border object-cover" />
        <div className="min-w-0">
          <h2 className="text-[0.9375rem] leading-snug font-semibold tracking-[-0.02em] text-pretty">{name}</h2>
          <p className="text-xs text-pretty text-muted-foreground">{meta}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

/** What the callback last received, so the payload is visible next to the picker. */
function Payload({ change }: { change: SalesUnitChange }): React.JSX.Element {
  const fields = Object.entries(change).map(([key, value]) => `${key}: ${typeof value === "string" ? `"${value}"` : value}`);
  return (
    <p className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 font-mono text-[0.6875rem] leading-relaxed [overflow-wrap:anywhere] text-muted-foreground">
      onChange({"{ "}
      {fields.join(", ")}
      {" }"})
    </p>
  );
}

export default function Demo(): React.JSX.Element {
  const [cans, setCans] = useState<SalesUnitChange>({ unit: "tray", quantity: 2, pieces: 24, total: 1920 });
  const [cheese, setCheese] = useState<SalesUnitChange>({ unit: "g", quantity: 500, total: 920 });
  return (
    <div className="grid w-full max-w-4xl min-w-0 gap-x-10 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr))]">
      <Example caption="Units: switch and the quantity converts, rounded up">
        <Product picture={CAN} name="Halcyon sparkling water, 33 cl" meta="Case lots for cafes and offices · SKU HW-330">
          <SalesUnitPicker units={CANS} value={cans.unit} quantity={cans.quantity} onChange={setCans} currency="EUR" locale="en-GB" />
        </Product>
        <Payload change={cans} />
      </Example>

      <Example caption="Weight: one-tap amounts or any amount, by the kilo">
        <Product picture={CHEESE} name="Aged Gouda, cut to order" meta="Kestrel Dairy · from the deli counter">
          <SalesUnitPicker mode="weight" pricePerKilo={1840} quantity={cheese.quantity} onChange={setCheese} currency="EUR" locale="en-GB" />
        </Product>
        <Payload change={cheese} />
      </Example>
    </div>
  );
}
