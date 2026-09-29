"use client";

import { useState } from "react";

import { ShippingProgress } from "@rhs-ui/commerce/shipping-progress";
import { Button } from "@rhs-ui/primitives/button";

export default function ShippingProgressDemo() {
  const [subtotal, setSubtotal] = useState(3900);
  return (
    <div className="grid w-full max-w-sm gap-4">
      <ShippingProgress subtotal={{ amount: subtotal, currency: "EUR" }} threshold={{ amount: 7500, currency: "EUR" }} />
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setSubtotal((amount) => amount + 1900)}>
          Add a tea towel (€19)
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setSubtotal(3900)} disabled={subtotal === 3900}>
          Reset
        </Button>
      </div>
    </div>
  );
}
