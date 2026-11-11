"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { ColumnGroupTable, type ColumnGroup } from "@rhs-ui/primitives/column-group-table";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

type Quarter = "q1" | "q2" | "q3" | "q4";
type Results = { region: string; q: Record<Quarter, { revenue: number; orders: number; margin: number }> };

// Each region has a size, an order count and a margin; every quarter moves them a little, the same way every time.
const BASE = [
  ["EMEA", 4200, 2100, 31],
  ["Americas", 3800, 1900, 28],
  ["APAC", 2600, 1300, 24],
  ["Nordics", 1500, 640, 33],
  ["DACH", 1900, 820, 30],
  ["Iberia", 980, 540, 22],
  ["Benelux", 1200, 610, 29],
  ["UK and Ireland", 1750, 880, 27],
  ["Eastern Europe", 760, 410, 21],
  ["Middle East", 890, 360, 25],
] as const;

const GROWTH: Record<Quarter, { revenue: number; orders: number; margin: number }> = {
  q1: { revenue: 0.92, orders: 0.9, margin: -1.2 },
  q2: { revenue: 1, orders: 1, margin: 0 },
  q3: { revenue: 1.06, orders: 1.07, margin: 0.6 },
  q4: { revenue: 1.14, orders: 1.12, margin: 1.1 },
};

const RESULTS: readonly Results[] = BASE.map(([region, revenue, orders, margin], index) => {
  const quarter = (name: Quarter, step: number) => {
    const wobble = ((index * 7 + step * 3) % 5) / 100;
    return {
      revenue: Math.round(revenue * (GROWTH[name].revenue + wobble)),
      orders: Math.round(orders * (GROWTH[name].orders + wobble / 2)),
      margin: Math.round((margin + GROWTH[name].margin + wobble * 10) * 10) / 10,
    };
  };
  return { region, q: { q1: quarter("q1", 1), q2: quarter("q2", 2), q3: quarter("q3", 3), q4: quarter("q4", 4) } };
});

const QUARTERS: readonly { id: Quarter; label: string }[] = [
  { id: "q1", label: "Q1" },
  { id: "q2", label: "Q2" },
  { id: "q3", label: "Q3" },
  { id: "q4", label: "Q4 forecast" },
];

const GROUPS: readonly ColumnGroup<Results>[] = QUARTERS.map(({ id, label }) => ({
  id,
  label,
  summary: "revenue",
  columns: [
    { key: "revenue", header: "Revenue", accessor: (row: Results) => row.q[id].revenue },
    { key: "orders", header: "Orders", accessor: (row: Results) => row.q[id].orders },
    { key: "margin", header: "Margin", cell: (row: Results) => `${row.q[id].margin.toFixed(1)}%` },
  ],
}));

type Plan = { plan: string; eur: { month: number; year: number; seats: number }; usd: { month: number; year: number; seats: number } };

const PLANS: readonly Plan[] = [
  { plan: "Starter", eur: { month: 9, year: 90, seats: 1 }, usd: { month: 10, year: 100, seats: 1 } },
  { plan: "Team", eur: { month: 29, year: 290, seats: 5 }, usd: { month: 32, year: 320, seats: 5 } },
  { plan: "Business", eur: { month: 79, year: 790, seats: 20 }, usd: { month: 85, year: 850, seats: 20 } },
];

const REGION_GROUPS: readonly ColumnGroup<Plan>[] = (["eur", "usd"] as const).map((currency) => ({
  id: currency,
  label: currency === "eur" ? "Europe, in euros" : "United States, in dollars",
  columns: [
    { key: "month", header: "Monthly", accessor: (row: Plan) => row[currency].month },
    { key: "year", header: "Yearly", accessor: (row: Plan) => row[currency].year },
    { key: "seats", header: "Seats", accessor: (row: Plan) => row[currency].seats },
  ],
}));

export default function Demo(): React.JSX.Element {
  const [folded, setFolded] = useState<readonly string[]>(["q1", "q2"]);

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-10 p-4 sm:p-8">
      <Example caption="Results by quarter: fold a quarter to its revenue; headings and regions stay in place">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" disabled={folded.length === GROUPS.length} onClick={() => setFolded(GROUPS.map((group) => group.id))}>
            Collapse all
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={folded.length === 0} onClick={() => setFolded([])}>
            Expand all
          </Button>
        </div>
        <ColumnGroupTable
          label="Results by region and quarter"
          columnGroups={GROUPS}
          rows={RESULTS}
          rowHeader={{ key: "region", header: "Region" }}
          getRowId={(row) => row.region}
          collapsed={folded}
          onCollapsedChange={setFolded}
          caption="Revenue in thousands of euros, orders in units, margin as a share of revenue."
          maxHeight="22rem"
        />
      </Example>

      <Example caption="Plans by region: two groups, no folding, plan names as row headers">
        <ColumnGroupTable
          label="Plan prices by region"
          columnGroups={REGION_GROUPS}
          rows={PLANS}
          rowHeader={{ key: "plan", header: "Plan" }}
          getRowId={(row) => row.plan}
          caption="Prices per month and per year, with the seats each plan includes."
        />
      </Example>
    </div>
  );
}
