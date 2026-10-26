"use client";

import { useState, type ReactNode } from "react";

import { SampleRequest, type Swatch } from "@rhs-ui/commerce/sample-request";

const svg = (body: string) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'>${body}</svg>`);

/** A seeded random number, so the pictures are the same every time. */
const random = (seed: number) => {
  let state = seed;
  return () => (state = (state * 1664525 + 1013904223) % 4294967296) / 4294967296;
};

/** Wood: a base colour with noise stretched along the plank for the grain. */
const wood = (base: string, [r, g, b]: readonly [number, number, number], seed: number) =>
  svg(
    `<filter id='w' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.01 0.42' numOctaves='3' seed='${seed}'/><feColorMatrix type='matrix' values='0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 0 0 0 1.9 -0.78'/></filter><rect width='160' height='160' fill='${base}'/><rect width='160' height='160' filter='url(#w)'/><path d='M0 53h160M0 107h160' stroke='#000' stroke-opacity='.12' stroke-width='1.5'/>`,
  );

const herringbone = svg(
  "<defs><pattern id='h' width='40' height='40' patternUnits='userSpaceOnUse'><path d='M0 10L20 30L40 10' fill='none' stroke='#c9a373' stroke-width='9'/><path d='M0 30L20 50L40 30' fill='none' stroke='#c9a373' stroke-width='9'/><path d='M0 -10L20 10L40 -10' fill='none' stroke='#b58c5c' stroke-width='9'/><path d='M0 10L20 30L40 10M0 30L20 50L40 30M0 -10L20 10L40 -10' fill='none' stroke='#7a5a38' stroke-opacity='.45' stroke-width='1'/></pattern></defs><rect width='160' height='160' fill='#bf9a68'/><rect width='160' height='160' fill='url(#h)'/>",
);

const terrazzo = (() => {
  const next = random(11);
  const colours = ["#b8a58c", "#8c8f86", "#d4c3a3", "#6f7a6e", "#c9b79b", "#a28d74", "#e7ddc9"];
  let chips = "";
  for (let index = 0; index < 52; index += 1) {
    const x = next() * 160;
    const y = next() * 160;
    const size = 3 + next() * 9;
    chips += `<polygon transform='rotate(${Math.round(next() * 360)} ${x.toFixed(1)} ${y.toFixed(1)})' points='${x.toFixed(1)},${(y - size).toFixed(1)} ${(x + size * 1.1).toFixed(1)},${(y + size * 0.4).toFixed(1)} ${(x - size * 0.6).toFixed(1)},${(y + size * 0.8).toFixed(1)}' fill='${colours[Math.floor(next() * colours.length)]}'/>`;
  }
  return svg(`<rect width='160' height='160' fill='#ebe4d6'/>${chips}`);
})();

const slate = svg(
  "<filter id='n' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.045 0.09' numOctaves='4' seed='9'/><feColorMatrix type='matrix' values='0 0 0 0 .84 0 0 0 0 .86 0 0 0 0 .88 0 0 0 1.1 -.42'/></filter><rect width='160' height='160' fill='#464a50'/><rect width='160' height='160' filter='url(#n)' opacity='.55'/>",
);

const linen = svg(
  "<defs><pattern id='l' width='4' height='4' patternUnits='userSpaceOnUse'><path d='M0 .5h4M.5 0v4' stroke='#8a7e68' stroke-opacity='.22' stroke-width='1'/></pattern></defs><rect width='160' height='160' fill='#e9e3d6'/><rect width='160' height='160' fill='url(#l)'/>",
);

const SWATCHES: readonly Swatch[] = [
  { id: "oak-natural", name: "Oak natural", note: "Matt oil, 14 mm", color: "#d8b98a", image: wood("#d8b98a", [0.46, 0.31, 0.16], 3) },
  { id: "oak-smoked", name: "Oak smoked", note: "Brushed, 14 mm", color: "#8d6a47", image: wood("#8d6a47", [0.2, 0.12, 0.06], 5) },
  { id: "walnut", name: "Walnut", note: "Satin lacquer, 15 mm", color: "#5a3b28", image: wood("#5a3b28", [0.1, 0.05, 0.03], 7) },
  { id: "ash-grey", name: "Ash grey", note: "Matt oil, 14 mm", color: "#b9b6ae", image: wood("#b9b6ae", [0.36, 0.35, 0.32], 12) },
  { id: "herringbone", name: "Herringbone oak", note: "70 × 420 mm", color: "#bf9a68", image: herringbone },
  { id: "terrazzo", name: "Terrazzo sand", note: "Honed, 600 × 600", color: "#ebe4d6", image: terrazzo },
  { id: "slate", name: "Slate", note: "Riven, 600 × 300", color: "#464a50", image: slate },
  { id: "linen", name: "Linen white", note: "Wall finish", color: "#e9e3d6", image: linen },
  { id: "sage", name: "Sage", note: "Microcement", color: "#9aa88f" },
  { id: "clay", name: "Clay", note: "Microcement", color: "#c98f6e" },
  { id: "chalk", name: "Chalk", note: "Microcement", color: "#efede8" },
  { id: "ink", name: "Ink", note: "Microcement", color: "#26282b" },
];

const SENT = { swatchIds: ["oak-natural", "walnut", "terrazzo"], address: { name: "Sanne de Vries", email: "sanne@fieldwork.example", line1: "Prinsengracht 412", postalCode: "1016 JB", city: "Amsterdam" }, reference: "SR-2026-20481" };

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function Example({ caption, note, children }: { caption: string; note?: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
      {note ? (
        <p role="status" className="text-xs text-muted-foreground">
          {note}
        </p>
      ) : null}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [log, setLog] = useState("Choose and remove samples, then send the request. The postcode 0000 AA shows a send that fails and keeps everything.");
  return (
    <div className="mx-auto grid w-full max-w-5xl min-w-0 gap-20 px-4 py-10 sm:px-6 sm:py-14">
      <Example caption="A flooring shop: twelve swatches as checkboxes, up to five of them, what was chosen beside the grid and an address" note={log}>
        <SampleRequest
          swatches={SWATCHES}
          limit={5}
          defaultValue={["oak-natural", "walnut", "terrazzo"]}
          address={{ name: "Sanne de Vries", email: "sanne@fieldwork.example" }}
          deliveryNote="Free, arrives in 3 to 5 days"
          shopHref="#shop"
          locale="en-GB"
          onChange={(ids) => setLog(`onChange: ${ids.length ? ids.join(", ") : "nothing chosen"}`)}
          onSubmit={async ({ swatchIds, address }) => {
            await wait(900);
            if (address.postalCode.replace(/\s/g, "") === "0000AA") return "We cannot deliver to that postcode yet. Nothing was sent.";
            setLog(`onSubmit received ${swatchIds.join(", ")} for ${address.city}`);
            return { reference: "SR-2026-20481" };
          }}
        />
      </Example>

      <div className="grid min-w-0 gap-x-10 gap-y-20">
        <Example caption="At the limit the rest are switched off and the counter says why; the chosen ones stay switched on, so one can always be taken out">
          <SampleRequest headingAs="h3" title="Order floor samples" description="Choose up to three samples, 10 × 10 cm each." swatches={SWATCHES.slice(0, 6)} limit={3} defaultValue={["oak-smoked", "walnut", "ash-grey"]} deliveryNote="Free, arrives in 3 to 5 days" locale="en-GB" />
        </Example>

        <Example caption="After a send the form is replaced by what is coming, where it is going and the order reference">
          <SampleRequest headingAs="h3" swatches={SWATCHES} submitted={SENT} deliveryNote="Free, arrives in 3 to 5 days" shopHref="#shop" locale="en-GB" />
        </Example>
      </div>
    </div>
  );
}
