import type { ReactNode } from "react";

import { NumericTable, type NumericColumn } from "@rhs-ui/primitives/numeric-table";

type Region = { id: string; region: string; q1: number; q2: number; q3: number | null; growth: number };

const REGIONS: readonly Region[] = [
  { id: "benelux", region: "Benelux", q1: 482000, q2: 515000, q3: 540500, growth: 0.082 },
  { id: "dach", region: "DACH", q1: 612000, q2: 598000, q3: 647000, growth: 0.041 },
  { id: "nordics", region: "Nordics", q1: 233000, q2: 261000, q3: 302000, growth: 0.153 },
  { id: "iberia", region: "Iberia", q1: 198000, q2: 176000, q3: 161000, growth: -0.067 },
  { id: "uki", region: "UK and Ireland", q1: 405000, q2: 389000, q3: 352000, growth: -0.024 },
  { id: "eastern", region: "Eastern Europe", q1: 96000, q2: 118000, q3: null, growth: 0.212 },
];

const REVENUE: readonly NumericColumn<Region>[] = [
  { key: "region", header: "Region", kind: "text" },
  { key: "q1", header: "Q1", kind: "currency", currency: "EUR", precision: 0, total: "sum", className: "hidden @xl:table-cell" },
  { key: "q2", header: "Q2", kind: "currency", currency: "EUR", precision: 0, total: "sum", className: "hidden @xl:table-cell" },
  { key: "q3", header: "Q3", kind: "currency", currency: "EUR", precision: 0, total: "sum", className: "hidden @xl:table-cell" },
  // A year to date that leans on a missing quarter is not worked out: it reads "no data", not a smaller number.
  { key: "ytd", header: "YTD", kind: "currency", currency: "EUR", precision: 0, total: "sum", mark: "both", accessor: (row) => (row.q3 === null ? null : row.q1 + row.q2 + row.q3) },
  { key: "growth", header: "Growth", kind: "percent", precision: 1, total: "average", mark: "both" },
];

type Unit = { id: string; unit: string; setpoint: number; reading: number | null; doors: number };

const UNITS: readonly Unit[] = [
  { id: "freezer-a", unit: "Chest freezer A", setpoint: -18, reading: -17.6, doors: 14 },
  { id: "freezer-b", unit: "Chest freezer B", setpoint: -18, reading: -19.2, doors: 9 },
  { id: "room-1", unit: "Cold room 1", setpoint: 4, reading: 3.1, doors: 31 },
  { id: "room-2", unit: "Cold room 2", setpoint: 4, reading: 5.4, doors: 27 },
  { id: "chiller", unit: "Blast chiller", setpoint: -35, reading: null, doors: 3 },
];

const READINGS: readonly NumericColumn<Unit>[] = [
  { key: "unit", header: "Unit", kind: "text" },
  { key: "setpoint", header: "Set point", unit: "°C", precision: 1, className: "hidden @xl:table-cell" },
  { key: "reading", header: "Reading", unit: "°C", precision: 1, mark: "both" },
  { key: "deviation", header: "Deviation", unit: "°C", precision: 1, total: "average", accessor: (row) => (row.reading === null ? null : row.reading - row.setpoint) },
  { key: "doors", header: "Door openings", precision: 0, total: "sum", className: "hidden @xl:table-cell" },
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-12 p-2 sm:p-6">
      <Example caption="Money and percentages in en-IE: tabular digits on the right, true minus signs, and a totals row. In YTD and Growth an up arrow marks the highest figure of the column and a down arrow the lowest (not a change over time), in words for a screen reader">
        <div className="@container overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <NumericTable
            columns={REVENUE}
            rows={REGIONS}
            locale="en-IE"
            caption={
              <span className="block px-4 pb-3 text-left">
                Revenue by region, 2026. YTD is year to date, growth is against 2025. Eastern Europe has no Q3, so it has no YTD, and the YTD total leaves it out: that is why it is lower than the three quarters added up.
              </span>
            }
          />
        </div>
      </Example>

      <Example caption="Units in the header, written once, and decimal commas for de-DE. A missing reading says so instead of showing zero, and is left out of the average">
        <div className="@container overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <NumericTable
            columns={READINGS}
            rows={UNITS}
            locale="de-DE"
            caption={<span className="block px-4 pb-3 text-left">Cold storage readings at 06:00. Deviation is the reading minus the set point.</span>}
          />
        </div>
      </Example>
    </div>
  );
}
