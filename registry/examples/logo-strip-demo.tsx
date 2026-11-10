import type { ReactNode } from "react";

import { LogoStrip } from "@rhs-ui/marketing/logo-strip";
import { Button } from "@rhs-ui/primitives/button";

type Shape = "circle" | "square" | "triangle" | "ring" | "diamond" | "bars";

/** A small shape on a 28 unit grid, so the wordmarks read as marks and not as plain text. */
function MarkShape({ shape }: { shape: Shape }): React.JSX.Element {
  switch (shape) {
    case "circle":
      return <circle cx="11" cy="14" r="9" fill="currentColor" />;
    case "square":
      return <rect x="2" y="5" width="18" height="18" rx="3" fill="currentColor" />;
    case "triangle":
      return <path d="M11 4.5 20.5 22.5H1.5z" fill="currentColor" />;
    case "ring":
      return <circle cx="11" cy="14" r="7.5" fill="none" stroke="currentColor" strokeWidth="3.5" />;
    case "diamond":
      return <path d="M11 3 20 14 11 25 2 14z" fill="currentColor" />;
    default:
      return (
        <g fill="currentColor">
          <rect x="2" y="5" width="4.5" height="18" rx="1.2" />
          <rect x="8.75" y="9" width="4.5" height="14" rx="1.2" />
          <rect x="15.5" y="13" width="4.5" height="10" rx="1.2" />
        </g>
      );
  }
}

/** A wordmark drawn in SVG text beside a shape, in the text colour. Made up for this demo; in your page these are your customers' own files. */
function Wordmark({ name, shape, weight = 600 }: { name: string; shape: Shape; weight?: number }): React.JSX.Element {
  // The text is given the length it is drawn at, so every mark is the same width in every browser and font. The length is worked out
  // from the letters (narrow ones, wide ones, capitals), so the drawing is never stretched much to meet it.
  const length = Math.round([...name].reduce((sum, letter) => sum + (/[ilj]/.test(letter) ? 5.5 : /[tfr]/.test(letter) ? 7.5 : /[mw]/.test(letter) ? 16 : /[A-Z]/.test(letter) ? 13.2 : 11.2), 0));
  return (
    <svg viewBox={`0 0 ${30 + length} 28`} aria-hidden="true" focusable="false">
      <MarkShape shape={shape} />
      <text x="29" y="20.5" fontSize="20" fontWeight={weight} textLength={length} lengthAdjust="spacingAndGlyphs" fill="currentColor">
        {name}
      </text>
    </svg>
  );
}

const CUSTOMERS: readonly { name: string; shape: Shape; weight?: number }[] = [
  { name: "Northwind", shape: "ring" },
  { name: "Halcyon", shape: "circle", weight: 500 },
  { name: "Kestrel", shape: "triangle", weight: 700 },
  { name: "Polder", shape: "square" },
  { name: "Lumen", shape: "bars", weight: 500 },
  { name: "Fjord", shape: "diamond" },
];

const logo = (customer: (typeof CUSTOMERS)[number], href?: string): { name: string; mark: ReactNode; href?: string } => ({
  name: customer.name,
  mark: <Wordmark name={customer.name} shape={customer.shape} weight={customer.weight} />,
  href,
});

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-6xl gap-14 px-6 py-6">
      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          Under a hero: the lead-in on the left with a link to the rest, the marks sharing the row in the muted text colour. Each one is a link to its case study and says so on focus. The strip answers to its own width: from 56rem the marks share one row beside the lead-in; narrower, they sit three to a row, so six make two even rows (beside the lead-in down to 42rem, under it below that).
        </figcaption>
        <div className="rounded-xl border border-border px-6 pt-14 pb-4 sm:px-10">
          <div className="mx-auto grid max-w-xl justify-items-center gap-4 text-center">
            <h2 className="text-3xl font-medium tracking-[-0.04em] text-balance sm:text-4xl">Scheduling that keeps the week true</h2>
            <p className="max-w-md text-[0.9375rem] leading-relaxed text-muted-foreground">Plan once, and Halcyon moves the reminders, the payments and the reports with it.</p>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <Button size="lg">Start your free trial</Button>
              <Button size="lg" variant="outline">
                See a demo
              </Button>
            </div>
          </div>
          <LogoStrip
            className="mt-10 border-t border-border pt-10 pb-6"
            title="Trusted by 2,400 teams"
            more={{ label: "and 2,300 more", href: "#customers" }}
            logos={CUSTOMERS.map((customer) => logo(customer, `#${customer.name.toLowerCase()}`))}
          />
        </div>
      </figure>

      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">Five marks, none of them linked, and no link to more: the same row, quieter. Screen readers still hear every company by name.</figcaption>
        <div className="rounded-xl border border-border px-6 sm:px-10">
          <LogoStrip title="Chosen by 180 studios and shops" logos={CUSTOMERS.slice(0, 5).map((customer) => logo(customer))} />
        </div>
      </figure>
    </div>
  );
}
