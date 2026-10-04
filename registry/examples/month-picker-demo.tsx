"use client";

import { useState } from "react";

import { Label } from "@rhs-ui/primitives/label";
import { MonthPicker } from "@rhs-ui/primitives/month-picker";

export default function Demo(): React.JSX.Element {
  const [month, setMonth] = useState<string | null>("2026-03");
  return (
    <div className="mx-auto grid max-w-xs gap-2 p-8">
      <Label htmlFor="month-demo">Report period</Label>
      <MonthPicker id="month-demo" value={month} onValueChange={setMonth} min="2024-01" max="2026-04" name="period" />
      <p className="text-xs text-muted-foreground">Submits: {month ?? "nothing yet"}</p>
    </div>
  );
}
