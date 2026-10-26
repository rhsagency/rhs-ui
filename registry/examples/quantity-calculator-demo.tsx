"use client";

import { useState, type ReactNode } from "react";

import { QuantityCalculator } from "@rhs-ui/commerce/quantity-calculator";

const pic = (bg: string, body: string) =>
  "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><rect width='120' height='120' fill='${bg}'/>${body}</svg>`);

/** Four porcelain tiles on a light floor, drawn flat. */
const TILES = pic(
  "#e7e4de",
  "<rect x='20' y='20' width='38' height='38' rx='2' fill='#b9b2a5'/><rect x='62' y='20' width='38' height='38' rx='2' fill='#cfc9bd'/><rect x='20' y='62' width='38' height='38' rx='2' fill='#cfc9bd'/><rect x='62' y='62' width='38' height='38' rx='2' fill='#b9b2a5'/><path d='M26 34l18-8M68 76l20-9' stroke='#fff' stroke-opacity='.35' stroke-width='3' stroke-linecap='round'/>",
);

/** Oak planks laid in a row. */
const PLANKS = pic(
  "#ece4d6",
  "<rect x='14' y='22' width='92' height='20' rx='2' fill='#b98a54'/><rect x='14' y='50' width='92' height='20' rx='2' fill='#c99b63'/><rect x='14' y='78' width='92' height='20' rx='2' fill='#ad7f4a'/><path d='M40 22v20M76 50v20M52 78v20' stroke='#8f6638' stroke-width='1.5'/><path d='M20 32h26M58 60h30M24 88h22' stroke='#fff' stroke-opacity='.25' stroke-width='2' stroke-linecap='round'/>",
);

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function Example({ caption, note, children }: { caption: string; note: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
      <p role="status" className="text-xs text-muted-foreground tabular-nums">
        {note}
      </p>
    </div>
  );
}

function Product({ picture, name, meta, children }: { picture: string; name: string; meta: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="grid grid-cols-[minmax(0,1fr)] gap-5 rounded-xl border border-border bg-card p-5 shadow-xs" aria-label={name}>
      <div className="flex items-center gap-3 border-b border-border pb-5">
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

export default function Demo(): React.JSX.Element {
  const [tiles, setTiles] = useState(0);
  const [floor, setFloor] = useState(0);
  return (
    <div className="grid w-full max-w-4xl min-w-0 gap-x-10 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,21rem),1fr))]">
      <Example caption="Square metres, entered as one area" note={tiles ? `In your cart: ${tiles} ${tiles === 1 ? "pack" : "packs"} of tiles.` : "The button hands the computed quantity to your cart."}>
        <Product picture={TILES} name="Kestrel porcelain tile, 60 × 60 cm" meta="Matt stone grey · 4 tiles per pack">
          <QuantityCalculator
            coveragePerPack={1.44}
            packPrice={3890}
            defaultArea={7.5}
            wastePercent={10}
            currency="EUR"
            locale="en-GB"
            onAddToCart={async (quantity) => {
              await wait(700);
              setTiles(quantity);
            }}
          />
        </Product>
      </Example>

      <Example caption="Square feet, entered as length and width" note={floor ? `In your cart: ${floor} ${floor === 1 ? "carton" : "cartons"} of flooring.` : "The same calculator, with the room measured by its sides."}>
        <Product picture={PLANKS} name="Northwind engineered oak, 7.5 in plank" meta="Click-lock · 12 planks per carton">
          <QuantityCalculator
            unit="ft2"
            coveragePerPack={22.6}
            packPrice={11840}
            defaultSize={{ length: 16, width: 12.5 }}
            wastePercent={8}
            packLabel={{ one: "carton", other: "cartons" }}
            currency="USD"
            locale="en-US"
            onAddToCart={async (quantity) => {
              await wait(700);
              setFloor(quantity);
            }}
          />
        </Product>
      </Example>
    </div>
  );
}
