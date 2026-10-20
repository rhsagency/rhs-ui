"use client";

import { useState } from "react";

import { ScrollFocusList, type ScrollFocusItem } from "@rhs-ui/motion/scroll-focus-list";

const STEPS: readonly ScrollFocusItem[] = [
  { title: "You place the order", description: "Checkout confirms stock and payment in a single step, so nothing is promised that cannot be shipped." },
  { title: "We pick and pack", description: "A picker gets the shortest route through the warehouse, and the box is weighed to catch a missing item before it leaves." },
  { title: "The courier collects", description: "Labels are printed at the dock, and tracking starts the moment the courier scans the parcel." },
  { title: "It travels", description: "Every scan shows on the map, and the delivery window is updated as the route changes." },
  { title: "It arrives", description: "A photo confirms the drop-off. If something is wrong, one tap opens a return." },
];

export default function Demo(): React.JSX.Element {
  const [step, setStep] = useState(0);
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <div className="flex items-end justify-between gap-4 pb-3">
        <p className="text-xs text-muted-foreground">Scroll the panel: the step at the reading line stays at full strength.</p>
        <p className="shrink-0 text-xs text-muted-foreground tabular-nums">
          Step {step + 1} of {STEPS.length}
        </p>
      </div>
      <div role="region" aria-label="Scrollable order journey" tabIndex={0} className="relative h-[min(32rem,calc(100dvh-5.5rem))] overflow-y-auto rounded-xl border border-border bg-card outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
        <div className="px-6 pt-8">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">Order journey</p>
          <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em] text-balance">From checkout to your door</h2>
        </div>
        <ScrollFocusList items={STEPS} lineAt={0.42} onActiveChange={setStep} aria-label="Order journey" className="px-6 pt-14 pb-72 [--rhs-focus-gap:5.5rem]" />
      </div>
    </div>
  );
}
