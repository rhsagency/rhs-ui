"use client";

import { useState } from "react";

import { PeriodCompare, type PeriodCompareValue } from "@rhs-ui/dashboard/period-compare";

export default function Demo(): React.JSX.Element {
  const [value, setValue] = useState<PeriodCompareValue>({ period: "30d", compare: true });
  return (
    <div className="mx-auto grid max-w-lg gap-4 p-8">
      <PeriodCompare value={value} onValueChange={setValue} periods={[{ value: "7d", label: "Last 7 days" }, { value: "30d", label: "Last 30 days" }, { value: "q", label: "This quarter" }, { value: "y", label: "This year" }]} />
      <p className="text-xs text-muted-foreground">Charts show {value.period}{value.compare ? ", against the period before" : ""}.</p>
    </div>
  );
}
