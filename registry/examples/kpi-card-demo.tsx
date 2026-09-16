"use client";
import { useState } from "react";
import { KpiCard } from "@rhs-ui/dashboard/kpi-card";
import { Button } from "@rhs-ui/primitives/button";
const periods = [{ value: 24850, trend: [8, 14, 11, 18, 16, 25, 29, 36] }, { value: 31420, trend: [12, 9, 18, 16, 28, 24, 38, 45] }] as const;
const format: Intl.NumberFormatOptions = { style: "currency", currency: "EUR", maximumFractionDigits: 0 };
export default function KpiCardDemo(): React.JSX.Element {
  const [period, setPeriod] = useState(0);
  const data = periods[period % 2]!;
  return <div className="flex w-full max-w-sm flex-col gap-5 p-5"><KpiCard label="Revenue" description={period % 2 ? "This month · sample data" : "Last month · sample data"} value={data.value} format={format} trend={data.trend} /><Button variant="outline" onClick={() => setPeriod(period + 1)}>Change period</Button></div>;
}
