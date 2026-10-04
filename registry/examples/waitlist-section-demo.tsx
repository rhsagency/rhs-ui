"use client";

import { WaitlistSection } from "@rhs-ui/marketing/waitlist-section";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <WaitlistSection
        title="Ledger for iPad is almost here."
        description="Plan with a pencil, sync to your team. We are letting people in each week, in order."
        waiting={4812}
        onJoin={() => new Promise<number>((resolve) => setTimeout(() => resolve(4813), 600))}
      />
    </div>
  );
}
