"use client";

import { useState } from "react";

import { SubscribeSave } from "@rhs-ui/commerce/subscribe-save";

export default function Demo(): React.JSX.Element {
  const [value, setValue] = useState<{ mode: "once" | "subscribe"; every: number }>({ mode: "subscribe", every: 2 });
  return (
    <div className="mx-auto max-w-md p-8">
      <p className="mb-3 text-sm font-medium">Single-origin beans, 500 g</p>
      <SubscribeSave price={{ amount: 1895, currency: "EUR" }} discount={0.1} intervals={[1, 2, 4]} value={value} onValueChange={setValue} />
    </div>
  );
}
