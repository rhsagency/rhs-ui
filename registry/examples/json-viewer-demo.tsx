"use client";

import { JsonViewer } from "@rhs-ui/primitives/json-viewer";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-xl p-8">
      <JsonViewer
        rootName="event"
        data={{ id: "evt_1Q2w3E", type: "order.paid", created: 1775200000, livemode: false, data: { order: { id: "ORD-10482", total: 7500, currency: "EUR", lines: [{ sku: "APRON-STONE", quantity: 1 }, { sku: "MUG-SAND", quantity: 2 }] }, customer: { id: "cus_8a7b", returning: true } } }}
      />
    </div>
  );
}
