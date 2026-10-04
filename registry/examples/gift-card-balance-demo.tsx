"use client";

import { GiftCardBalance } from "@rhs-ui/commerce/gift-card-balance";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-xl p-8">
      <GiftCardBalance
        pin
        onCheck={(code) => new Promise((resolve) => setTimeout(() => resolve(code.startsWith("0") ? null : { balance: { amount: 3750, currency: "EUR" }, expires: "31 December 2027" }), 600))}
      />
    </div>
  );
}
