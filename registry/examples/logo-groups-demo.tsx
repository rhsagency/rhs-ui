import type { ReactNode } from "react";

import { LogoGroups, type LogoGroup } from "@rhs-ui/marketing/logo-groups";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-6xl gap-14 px-6 py-6">
      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          Four sectors in two columns, cut apart by hairlines: the sector, how many customers it stands for (a link to that sector's list) and the marks at one height, four to a group on a tidy two-by-two grid from 1024px. Marks come to full strength on hover and focus, and each keeps its company name for screen readers. On a phone the groups stack in one column.
        </figcaption>
        <LogoGroups
          title="Trusted in the sectors that read the fine print"
          description="125 organisations across four industries run their rotas, routes and reports on Halcyon."
          groups={SECTORS}
          className="py-2 sm:py-4"
        />
      </figure>

      <figure className="grid gap-3 border-t border-border pt-10">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          Three sectors, the marks linked to their own stories and no sector lists: the count is plain text, and the odd last group spans both columns and lays its marks out in a single row of four.
        </figcaption>
        <LogoGroups
          title="Companies like yours are already here"
          groups={[
            { title: SECTORS[0]!.title, count: SECTORS[0]!.count, logos: logos([["Marlowe & Finch", "diamond"], ["Tulip Market", "circle", 500], ["Corner & Co", "square", 700], ["Brightside", "bars"]], true) },
            { title: SECTORS[1]!.title, count: SECTORS[1]!.count, logos: logos([["Ardent Bank", "triangle", 700], ["Kestrel Capital", "ring"], ["Fjordline", "bars", 500], ["Larch Insurance", "cross"]], true) },
            { title: SECTORS[2]!.title, count: SECTORS[2]!.count, logos: logos([["Polder Health", "cross"], ["Halden Clinics", "ring", 500], ["Mercy Lane", "circle", 700], ["Aster Labs", "dots"]], true) },
          ]}
          className="py-2 sm:py-4"
        />
      </figure>
    </div>
  );
}

// Below: the sectors the demo shows, and the marks it draws for them.

type Shape = "circle" | "square" | "triangle" | "ring" | "diamond" | "bars" | "cross" | "dots";

const SECTORS: readonly LogoGroup[] = [
  {
    title: "Retail",
    count: "38 customers",
    href: "#retail",
    logos: logos([
      ["Marlowe & Finch", "diamond"],
      ["Tulip Market", "circle", 500],
      ["Corner & Co", "square", 700],
      ["Brightside", "bars"],
    ]),
  },
  {
    title: "Finance",
    count: "27 customers",
    href: "#finance",
    logos: logos([
      ["Ardent Bank", "triangle", 700],
      ["Kestrel Capital", "ring"],
      ["Fjordline", "bars", 500],
      ["Larch Insurance", "cross"],
    ]),
  },
  {
    title: "Health",
    count: "41 customers",
    href: "#health",
    logos: logos([
      ["Polder Health", "cross", 600],
      ["Halden Clinics", "ring", 500],
      ["Mercy Lane", "circle", 700],
      ["Aster Labs", "dots"],
    ]),
  },
  {
    title: "Public sector",
    count: "19 customers",
    href: "#public-sector",
    logos: logos([
      ["City of Vlietstad", "square", 600],
      ["Fenwick County", "diamond", 500],
      ["Harbour Authority", "triangle"],
      ["Orchard Region", "dots", 700],
    ]),
  },
];

type Customer = readonly [name: string, shape: Shape, weight?: number];

function logos(customers: readonly Customer[], linked = false): LogoGroup["logos"] {
  return customers.map(([name, shape, weight]): { name: string; mark: ReactNode; href?: string } => ({
    name,
    mark: <Wordmark name={name} shape={shape} weight={weight} />,
    href: linked ? `#${name.toLowerCase().replace(/[^a-z]+/g, "-")}` : undefined,
  }));
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
