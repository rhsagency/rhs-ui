"use client";

import { useState, type ReactNode } from "react";

import { MetricDefinitionPopover } from "@rhs-ui/dashboard/metric-definition-popover";
import { Card, CardDescription, CardHeader, CardTitle } from "@rhs-ui/primitives/card";

// Fixed, so the demo reads the same today and next year: "2 hours ago" and "3 days ago" are measured from here.
const NOW = "2026-10-20T12:00:00Z";

function Row({ label, value, children }: { label: string; value: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-border px-6 py-3">
      <div className="flex min-w-0 items-center gap-1.5 text-sm">
        <span>{label}</span>
        {children}
      </div>
      <p className="font-medium tabular-nums">{value}</p>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  // The stage holds room for an open panel only while one is open, so a closed demo is as tall as its card instead of leaving a blank page under it.
  const [open, setOpen] = useState<string | null>("weekly-active");
  const bind = (id: string) => ({
    open: open === id,
    onOpenChange: (next: boolean) => setOpen((current) => (next ? id : current === id ? null : current)),
  });

  return (
    <div className={open ? "min-h-[44rem] w-full max-w-xl" : "w-full max-w-xl"}>
      <Card className="max-w-md gap-0 py-0">
        <CardHeader className="gap-1 py-5">
          <CardTitle className="text-base tracking-[-0.02em]">Revenue health</CardTitle>
          <CardDescription>Fourth quarter, to date</CardDescription>
        </CardHeader>

        <Row label="Net revenue retention" value="108.4%">
          <MetricDefinitionPopover
            {...bind("net-revenue-retention")}
            name="Net revenue retention"
            definition="The share of recurring revenue you keep from existing customers after churn, downgrades and expansion. Above 100% means the customers you have grow faster than they leave."
            formula="(starting MRR + expansion - contraction - churn) / starting MRR"
            source="Billing warehouse, finance.mrr_snapshots"
            refreshedAt="2026-10-20T10:05:00Z"
            owner={{ name: "Finance data team", href: "#finance-data" }}
            notes="Excludes one-off professional services."
            now={NOW}
          />
        </Row>
        <Row label="Gross margin" value="71.2%">
          <MetricDefinitionPopover
            {...bind("gross-margin")}
            name="Gross margin"
            definition="Revenue minus the direct cost of delivering it, as a share of revenue."
            formula="(revenue - cost of revenue) / revenue"
            source="General ledger, accounts 4000 to 5999"
            refreshedAt="2026-10-20T06:00:00Z"
            owner={{ name: "Priya Nair" }}
            now={NOW}
          />
        </Row>
        <Row label="Weekly active accounts" value="4,812">
          <MetricDefinitionPopover
            {...bind("weekly-active")}
            name="Weekly active accounts"
            definition="Accounts with at least one signed-in person who took an action in the last seven days."
            formula="count(distinct account_id) where last_action_at >= today - 7 days"
            source="Product events, analytics.events_daily"
            refreshedAt="2026-10-17T09:00:00Z"
            owner={{ name: "Growth analytics", href: "#growth" }}
            now={NOW}
          />
        </Row>
      </Card>
    </div>
  );
}
