import type { ReactNode } from "react";

import { LogoResultsGrid, type ResultLogo } from "@rhs-ui/marketing/logo-results-grid";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-6xl gap-14 px-6 py-6">
      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          Nine customers on a hairline grid, each with one line of outcome and the figure set heavier so the eye lands on it. A cell with a story is one link (focus ring inside, the arrow moves on hover); the two without are not links and carry no arrow.
        </figcaption>
        <LogoResultsGrid
          title="Every logo here has a result behind it"
          description="One line each. The links go to the full story."
          items={ITEMS}
          className="py-2 sm:py-4"
        />
      </figure>

      <figure className="grid gap-3 border-t border-border pt-10">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          Seven customers and no stories yet: no links, no arrows, the figure found for you in each line (the first number and its unit). Seven does not tile, so the last cell stretches across the free columns instead of leaving blank cells behind it (on a tablet, the same for an odd count).
        </figcaption>
        <LogoResultsGrid title="Small enough to sit between two sections" items={ITEMS.slice(0, 7).map(({ href: _href, metric: _metric, ...item }) => item)} className="py-2 sm:py-4" />
      </figure>
    </div>
  );
}

// Below: the customers the demo shows, and the marks it draws for them.

type Shape = "circle" | "square" | "triangle" | "ring" | "diamond" | "bars" | "cross" | "dots";

const ITEMS: readonly ResultLogo[] = [
  { name: "Northwind", mark: mark("Northwind", "ring"), result: "Cut late deliveries by 31 percent in eight weeks", metric: "31 percent", href: "#northwind" },
  { name: "Kestrel", mark: mark("Kestrel", "triangle", 700), result: "Closed the month in 4 days instead of 9", metric: "4 days", href: "#kestrel" },
  { name: "Polder Health", mark: mark("Polder", "cross"), result: "Reduced missed appointments by 28 percent", href: "#polder" },
  { name: "Lumen", mark: mark("Lumen", "bars", 500), result: "Cut support tickets by 41 percent", href: "#lumen" },
  { name: "Fjord Freight", mark: mark("Fjord", "diamond"), result: "Plans a week of routes in 1.1 hours, down from 3.5", metric: "1.1 hours", href: "#fjord" },
  { name: "Atlas Rail", mark: mark("Atlas", "square", 700), result: "Raised on-time arrivals to 95.9%", href: "#atlas" },
  { name: "Marlowe & Finch", mark: mark("Marlowe", "circle", 500), result: "Saved 12 hours of rota work every week" },
  { name: "Orchard Region", mark: mark("Orchard", "dots", 700), result: "Moved 2,100 staff onto one schedule in 6 weeks", metric: "2,100 staff", href: "#orchard" },
  { name: "Ardent Bank", mark: mark("Ardent", "triangle"), result: "Passed its audit with 0 findings on scheduling" },
];

function mark(name: string, shape: Shape, weight?: number): ReactNode {
  return <Wordmark name={name} shape={shape} weight={weight} />;
}

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
    case "cross":
      return <path d="M8.5 4h5v7.5H21v5h-7.5V24h-5v-7.5H1v-5h7.5z" fill="currentColor" />;
    case "dots":
      return (
        <g fill="currentColor">
          <circle cx="5.5" cy="8" r="3.5" />
          <circle cx="16.5" cy="8" r="3.5" />
          <circle cx="5.5" cy="20" r="3.5" />
          <circle cx="16.5" cy="20" r="3.5" />
        </g>
      );
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
  // The text is given the length it is drawn at, so every mark is the same width in every browser and font.
  const length = Math.round([...name].reduce((sum, letter) => sum + (/[ilj.]/.test(letter) ? 5.5 : /[tfr ]/.test(letter) ? 7.5 : /[mw&]/.test(letter) ? 16 : /[A-Z]/.test(letter) ? 13.2 : 11.2), 0));
  return (
    <svg viewBox={`0 0 ${30 + length} 28`} aria-hidden="true" focusable="false">
      <MarkShape shape={shape} />
      <text x="29" y="20.5" fontSize="20" fontWeight={weight} textLength={length} lengthAdjust="spacingAndGlyphs" fill="currentColor">
        {name}
      </text>
    </svg>
  );
}
