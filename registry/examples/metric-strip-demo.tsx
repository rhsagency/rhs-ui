"use client";

import { useState } from "react";

import { MetricStrip, type Metric } from "@rhs-ui/dashboard/metric-strip";
import { IconRefresh } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";

const EUR: Intl.NumberFormatOptions = { style: "currency", currency: "EUR", maximumFractionDigits: 0 };
const EUR_CENTS: Intl.NumberFormatOptions = { style: "currency", currency: "EUR" };
const RATE: Intl.NumberFormatOptions = { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 };
const COUNT: Intl.NumberFormatOptions = { maximumFractionDigits: 0 };

/** Three refreshes of the same store, so the figures visibly ease from one to the next. */
const SNAPSHOTS: readonly (readonly Metric[])[] = [
  [
    { id: "revenue", label: "Revenue", value: 24800, format: EUR, change: 0.042, hint: "Paid and shipped orders" },
    { id: "orders", label: "Orders", value: 612, format: COUNT, change: 0.018, hint: "11 more than last month" },
    { id: "conversion", label: "Conversion rate", value: 0.0318, format: RATE, change: -0.034, hint: "Sessions that ended in a sale" },
    { id: "aov", label: "Average order value", value: 40.52, format: EUR_CENTS, change: 0.0002, hint: "Before shipping and tax" },
  ],
  [
    { id: "revenue", label: "Revenue", value: 25360, format: EUR, change: 0.065, hint: "Paid and shipped orders" },
    { id: "orders", label: "Orders", value: 629, format: COUNT, change: 0.046, hint: "28 more than last month" },
    { id: "conversion", label: "Conversion rate", value: 0.0327, format: RATE, change: -0.007, hint: "Sessions that ended in a sale" },
    { id: "aov", label: "Average order value", value: 40.32, format: EUR_CENTS, change: -0.003, hint: "Before shipping and tax" },
  ],
  [
    { id: "revenue", label: "Revenue", value: 23915, format: EUR, change: 0.004, hint: "Paid and shipped orders" },
    { id: "orders", label: "Orders", value: 588, format: COUNT, change: -0.021, hint: "13 fewer than last month" },
    { id: "conversion", label: "Conversion rate", value: 0.0301, format: RATE, change: -0.059, hint: "Sessions that ended in a sale" },
    { id: "aov", label: "Average order value", value: 40.67, format: EUR_CENTS, change: 0.0125, hint: "Before shipping and tax" },
  ],
];

const GAPS: readonly Metric[] = [
  { id: "revenue", label: "Revenue", value: 18240, format: EUR, change: 0.031, hint: "Paid and shipped orders" },
  { id: "subscribers", label: "Newsletter subscribers", value: null, missing: "Connect your newsletter tool to see subscribers." },
  { id: "refunds", label: "Refund rate", value: 0.008, format: { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }, change: null, hint: "Started tracking this week" },
  { id: "backlog", label: "Open tickets", value: 17, format: COUNT, change: -0.22, hint: "Waiting on a reply" },
];

const SMALL: readonly Metric[] = [
  { id: "visits", label: "Visits", value: 48210, format: { notation: "compact", maximumFractionDigits: 1 }, change: 0.087 },
  { id: "signups", label: "Sign-ups", value: 1284, format: COUNT, change: 0.112 },
  { id: "churn", label: "Churn", value: 0.021, format: { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }, change: -0.18 },
];

function Caption({ children }: { children: string }): React.JSX.Element {
  return <p className="mb-3 text-xs text-muted-foreground">{children}</p>;
}

export default function Demo(): React.JSX.Element {
  const [snapshot, setSnapshot] = useState(0);
  const metrics = SNAPSHOTS[snapshot % SNAPSHOTS.length] ?? SNAPSHOTS[0] ?? [];

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-12 px-4 py-10 sm:px-6">
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-medium tracking-[-0.02em]">Northwind store</h2>
            <p className="text-xs text-muted-foreground">October 2026, compared with September. Revenue reads first.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setSnapshot((current) => current + 1)}>
            <IconRefresh />
            Refresh numbers
          </Button>
        </div>
        <MetricStrip metrics={metrics} emphasis="revenue" periodLabel="last month" locale="en-IE" label="Store performance" />
      </section>

      <section>
        <Caption>Missing data says why, and a metric with no earlier period says so instead of showing a zero</Caption>
        <MetricStrip metrics={GAPS} periodLabel="last month" locale="en-IE" label="Store health" />
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <Caption>Loading keeps the layout and the labels</Caption>
          <MetricStrip metrics={SNAPSHOTS[0] ?? []} loading locale="en-IE" label="Store performance" />
        </div>
        <div>
          <Caption>Compact density, three metrics</Caption>
          <MetricStrip metrics={SMALL} density="compact" periodLabel="last week" locale="en-IE" label="Product usage" />
        </div>
      </section>
    </div>
  );
}
