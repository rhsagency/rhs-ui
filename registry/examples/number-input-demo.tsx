"use client";

import { useState } from "react";

import { Label } from "@rhs-ui/primitives/label";
import { NumberInput } from "@rhs-ui/primitives/number-input";

export default function Demo(): React.JSX.Element {
  const [seats, setSeats] = useState(3);
  return (
    <div className="grid w-full max-w-xs gap-6">
      <div className="grid gap-2">
        <Label htmlFor="seats">Seats</Label>
        <NumberInput id="seats" min={1} max={10} value={seats} onValueChange={setSeats} />
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {seats} of 10 seats. {10 - seats} left on this plan.
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="budget">Monthly budget</Label>
        <NumberInput id="budget" className="w-44" min={0} step={50} defaultValue={1200} format={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }} />
      </div>
    </div>
  );
}
