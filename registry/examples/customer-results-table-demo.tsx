import type { ReactNode } from "react";

import { CustomerResultsTable, type CustomerResult } from "@rhs-ui/marketing/customer-results-table";

type Shape = "circle" | "square" | "triangle" | "ring" | "diamond" | "bars";

/** A small mark on a 24 unit grid, in the text colour. Made up for this demo; in your page these are your customers' own marks. */
function Mark({ shape }: { shape: Shape }): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {shape === "circle" ? <circle cx="12" cy="12" r="9" fill="currentColor" /> : null}
      {shape === "square" ? <rect x="3.5" y="3.5" width="17" height="17" rx="3" fill="currentColor" /> : null}
      {shape === "triangle" ? <path d="M12 3.5 21.5 20.5h-19z" fill="currentColor" /> : null}
      {shape === "ring" ? <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="4" /> : null}
      {shape === "diamond" ? <path d="M12 2.5 21.5 12 12 21.5 2.5 12z" fill="currentColor" /> : null}
      {shape === "bars" ? (
        <g fill="currentColor">
          <rect x="3" y="4" width="4.5" height="16" rx="1.2" />
          <rect x="9.75" y="8" width="4.5" height="12" rx="1.2" />
          <rect x="16.5" y="12" width="4.5" height="8" rx="1.2" />
        </g>
      ) : null}
    </svg>
  );
}

const mark = (shape: Shape): ReactNode => <Mark shape={shape} />;

const ROWS: readonly CustomerResult[] = [
  { customer: "Northwind Logistics", mark: mark("ring"), industry: "Logistics", metric: "Late deliveries", before: "14.2%", after: "9.8%", change: "−31%", period: "8 weeks", href: "#northwind" },
  { customer: "Kestrel Studio", mark: mark("triangle"), industry: "Professional services", metric: "Month-end close", before: "9 days", after: "4 days", change: "−56%", period: "1 quarter", href: "#kestrel" },
  { customer: "Polder Health", mark: mark("circle"), industry: "Healthcare", metric: "Missed appointments", before: "11.0%", after: "7.9%", change: "−28%", period: "10 weeks", href: "#polder" },
  { customer: "Lumen Energy", mark: mark("bars"), industry: "Energy", metric: "Support tickets a week", before: "1,240", after: "731", change: "−41%", period: "6 weeks", href: "#lumen" },
  { customer: "Fjord Freight", mark: mark("diamond"), industry: "Transport", metric: "Weekly route planning", before: "3.5 h", after: "1.1 h", change: "−69%", period: "3 weeks", href: "#fjord" },
  { customer: "Atlas Rail", mark: mark("square"), industry: "Public transport", metric: "On-time arrivals", before: "91.4%", after: "95.9%", change: "+4.5 pts", period: "5 months", href: "#atlas" },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-6xl gap-14 px-6 py-6">
      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          Six customers in a real table: who, their industry, what was measured, before and after, and how long it took. After is set heavier with its signed change beside it, every figure uses tabular digits, and the names are links to the stories. The caption states the source and the method. On a phone each row becomes a card that leads with the outcome (the metric, then before and after with the change) and keeps all six labels for screen readers, with no sideways scrolling.
        </figcaption>
        <CustomerResultsTable
          title="What changed after Halcyon, in numbers"
          rows={ROWS}
          caption="Source: customer-reported figures, each confirmed against the customer's own export, July 2025 to October 2026. Before is the eight weeks before go-live and After is weeks nine to sixteen after it; where a customer runs several sites, the figure is the median across them."
          className="py-2 sm:py-4"
        />
      </figure>

      <figure className="grid gap-3 border-t border-border pt-10">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          Four customers without a story page and without marks: the name is plain text and the tile holds the first letter. The last change is written out in full ("+12.5 percentage points"): the change has a column of its own, so that column widens to fit it and nothing is overprinted, in the table or on a phone.
        </figcaption>
        <CustomerResultsTable
          title="Early results from the pilot group"
          rows={[
            ...ROWS.slice(2, 5).map(({ href: _href, mark: _mark, ...row }) => row),
            { customer: "Orchard Region", industry: "Public sector", metric: "Rota fill rate", before: "82.1%", after: "94.6%", change: "+12.5 percentage points", period: "7 weeks" },
          ]}
          caption="Source: pilot sites, September to October 2026, self-reported and not yet audited."
          className="py-2 sm:py-4"
        />
      </figure>
    </div>
  );
}
