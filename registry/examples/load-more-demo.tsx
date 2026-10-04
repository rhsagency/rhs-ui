"use client";

import { useState } from "react";

import { LoadMore } from "@rhs-ui/primitives/load-more";

const TOTAL = 26;

export default function Demo(): React.JSX.Element {
  const [shown, setShown] = useState(12);
  return (
    <div className="mx-auto max-w-2xl p-8">
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {Array.from({ length: shown }, (_, index) => (
          <li key={index} className="aspect-square rounded-lg bg-muted" />
        ))}
      </ul>
      <LoadMore shown={shown} total={TOTAL} noun="products" onLoadMore={() => new Promise<void>((resolve) => setTimeout(() => { setShown((value) => Math.min(value + 12, TOTAL)); resolve(); }, 500))} />
    </div>
  );
}
