"use client";

import { useState } from "react";

import { CurrencyInput } from "@rhs-ui/primitives/currency-input";
import { Label } from "@rhs-ui/primitives/label";

export default function Demo(): React.JSX.Element {
  const [amount, setAmount] = useState<number | null>(125000);
  return (
    <div className="mx-auto grid max-w-sm gap-2 p-8">
      <Label htmlFor="budget-demo">Monthly budget</Label>
      <CurrencyInput id="budget-demo" value={amount} onValueChange={setAmount} />
      <p className="text-xs text-muted-foreground">In cents: <span className="font-mono">{amount ?? "empty"}</span></p>
    </div>
  );
}
