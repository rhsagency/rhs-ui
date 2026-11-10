"use client";

import { useState, type ReactNode } from "react";

import { ArchiveNav, type ArchivePeriod, type ArchivePlace } from "@rhs-ui/primitives/archive-nav";

/** Posts per month, January first. A missing month has no entry at all. */
const COUNTS: Record<number, readonly number[]> = {
  2026: [2, 3, 4, 1, 3, 2, 0, 1, 5, 3],
  2025: [3, 2, 4, 3, 5, 2, 1, 0, 4, 3, 4, 2],
  2024: [2, 3, 3, 4, 2, 3, 2, 1, 3, 4, 3, 2],
  2023: [4, 3, 2, 3, 1, 2, 3, 2, 2, 1, 3, 2],
  2022: [1, 2, 2, 1, 3, 1, 0, 1, 2, 2, 1, 1],
  2021: [2, 1, 3, 1, 0, 2, 1, 1, 2, 0, 1, 1],
  2020: [1, 0, 2, 1, 1, 1, 0, 0, 2, 1, 0, 1],
  2019: [0, 1, 1, 2, 0, 1, 1, 0, 1, 0, 2, 1],
  2018: [1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0],
};

const periods = (link: (year: number, month: number) => string | undefined): ArchivePeriod[] =>
  Object.entries(COUNTS).map(([year, counts]) => ({
    year: Number(year),
    months: counts.map((count, index) => ({ month: index + 1, count, href: link(Number(year), index + 1) })),
  }));

const TITLES = [
  "Retries, backoff and the 5 a.m. page",
  "What changed in the billing export",
  "Notes from the Rotterdam offsite",
  "Why we moved invoices off the request path",
  "A year of weekly releases",
  "Shipping a status page people actually read",
  "Cutting the p99 of the search endpoint in half",
  "How we run incident reviews",
  "Seat-based pricing, two years on",
  "Designing the empty states",
  "What we learned from 400 support tickets",
  "Release notes, in plain words",
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </section>
  );
}

function Blog(): React.JSX.Element {
  const [place, setPlace] = useState<ArchivePlace>({ year: 2026, month: 10 });
  const count = COUNTS[place.year]?.[(place.month ?? 1) - 1] ?? 0;
  return (
    <div className="grid gap-6 rounded-xl border border-border bg-card p-4 shadow-xs sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-8 sm:p-5">
      <div className="grid content-start gap-3">
        <h2 className="px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Archive</h2>
        <ArchiveNav periods={periods(() => undefined)} current={place} onNavigate={(next) => setPlace(next)} label="Blog archive" />
      </div>
      <div className="grid min-w-0 content-start gap-4 border-t border-border pt-5 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-8">
        <div className="grid gap-0.5">
          <h2 className="text-base font-semibold tracking-[-0.02em]">
            {MONTHS[(place.month ?? 1) - 1]} {place.year}
          </h2>
          <p className="text-xs text-muted-foreground tabular-nums">{count === 1 ? "1 post" : `${count} posts`}</p>
        </div>
        <ul className="grid gap-0 divide-y divide-border rounded-lg border border-border">
          {Array.from({ length: count }, (_, index) => (
            <li key={index} className="grid gap-0.5 px-4 py-3">
              <p className="text-sm font-medium tracking-[-0.01em]">{TITLES[(place.year + (place.month ?? 1) + index) % TITLES.length]}</p>
              <p className="text-xs text-muted-foreground">
                {index * 6 + 3} {MONTHS[(place.month ?? 1) - 1]}, 6 min read
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const DUTCH: ArchivePeriod[] = [
  { year: 2026, months: [9, 10].map((month, index) => ({ month, count: [4, 2][index] ?? 0, href: `#2026-${month}` })) },
  { year: 2025, months: [3, 6, 11].map((month, index) => ({ month, count: [1, 3, 2][index] ?? 0, href: `#2025-${month}` })) },
  { year: 2024, months: [1, 2].map((month, index) => ({ month, count: [2, 0][index] ?? 0, href: `#2024-${month}` })) },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl gap-12">
      <Example caption="The year you are in is open. Older years fold; the button after them stays where it is, so focus does too.">
        <Blog />
      </Example>
      <Example caption="Links, in Dutch: month names and numbers follow the locale, and a month with no posts is not a link.">
        <div className="max-w-xs rounded-xl border border-border bg-card p-4 shadow-xs">
          <ArchiveNav
            periods={DUTCH}
            current={{ year: 2026, month: 10 }}
            locale="nl-NL"
            label="Archief"
            labels={{ one: "{count} bericht", other: "{count} berichten", none: "geen berichten", more: "Toon {count} eerdere jaren", fewer: "Toon minder jaren" }}
          />
        </div>
      </Example>
    </div>
  );
}
