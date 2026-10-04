"use client";

import { useState } from "react";

import { BarList } from "@rhs-ui/dashboard/bar-list";
import { ChartCard } from "@rhs-ui/dashboard/chart-card";
import { MetricDelta } from "@rhs-ui/primitives/metric-delta";

const DATA: Record<string, { name: string; value: number }[]> = {
  "7d": [{ name: "Search", value: 5820 }, { name: "Direct", value: 3110 }, { name: "Social", value: 1450 }, { name: "Email", value: 920 }],
  "30d": [{ name: "Search", value: 24100 }, { name: "Direct", value: 13900 }, { name: "Social", value: 7200 }, { name: "Email", value: 3600 }],
};

export default function Demo(): React.JSX.Element {
  const [period, setPeriod] = useState("7d");
  const total = (DATA[period] ?? []).reduce((sum, row) => sum + row.value, 0);
  return (
    <div className="mx-auto max-w-lg p-8">
      <ChartCard
        title="Visitors by source"
        value={<span className="flex items-center gap-2 tabular-nums">{total.toLocaleString("en-GB")} <MetricDelta change={period === "7d" ? 0.06 : 0.11} /></span>}
        periods={[{ value: "7d", label: "7 days" }, { value: "30d", label: "30 days" }]}
        period={period}
        onPeriodChange={setPeriod}
        footnote="Source: site analytics, updated 5 min ago"
      >
        <BarList items={DATA[period] ?? []} />
      </ChartCard>
    </div>
  );
}
