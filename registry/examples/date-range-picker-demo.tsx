"use client";

import { useState } from "react";

import { DateRangePicker, type DateRange } from "@rhs-ui/primitives/date-range-picker";

export default function Demo(): React.JSX.Element {
  const [range, setRange] = useState<DateRange>({ from: new Date(2026, 3, 6), to: new Date(2026, 3, 12) });
  return (
    <div className="flex min-h-40 items-start justify-center p-8">
      <DateRangePicker value={range} onValueChange={setRange} />
    </div>
  );
}
