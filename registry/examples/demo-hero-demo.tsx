"use client";

import { DemoHero } from "@rhs-ui/marketing/demo-hero";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <DemoHero
        title="See Ledger on your own roadmap."
        description="A short call where we import one of your projects and show you what changes in the first week."
        agenda={["Your roadmap, imported live", "How decisions stay findable", "Pricing for your team size"]}
        onSubmit={() => new Promise<void>((resolve) => setTimeout(resolve, 700))}
        proof={<p className="text-sm text-muted-foreground">Used by 1,800 teams, from four-person studios to public broadcasters.</p>}
      />
    </div>
  );
}
