"use client";

import { useState } from "react";

import { CompareTray, type CompareItem } from "@rhs-ui/commerce/compare-tray";

const ITEMS: CompareItem[] = [
  { id: "a", title: "Aero 2 pendant lamp" },
  { id: "b", title: "Aero 3 pendant lamp" },
];

export default function Demo(): React.JSX.Element {
  const [items, setItems] = useState(ITEMS);
  return (
    <div className="relative mx-auto h-72 max-w-3xl overflow-hidden rounded-2xl border border-border">
      <div className="p-6 text-sm text-muted-foreground">
        {items.length ? "Products you tick on a listing collect in the tray below." : <button type="button" className="underline underline-offset-4" onClick={() => setItems(ITEMS)}>Add the lamps again</button>}
      </div>
      {items.length ? <CompareTray className="absolute" items={items} max={4} compareHref="#compare" onRemove={(id) => setItems((list) => list.filter((item) => item.id !== id))} onClear={() => setItems([])} /> : null}
    </div>
  );
}
