"use client";

import { AiArtifactCard } from "@rhs-ui/application/ai-artifact-card";

const PLAN = `# Q2 launch plan

## Goal
Ship onboarding v2 to every new workspace by 30 June.

## Milestones
- 12 May: design review
- 26 May: beta for 50 teams
- 16 June: general availability

## Risks
- Import from Asana is still slow above 5,000 tasks.`;

const CODE = `function usageTotal(units: number, tiers: Tier[]) {
  let from = 0;
  let total = 0;
  for (const tier of tiers) {
    if (units <= from) break;
    total += (Math.min(units, tier.upTo) - from) * tier.price;
    from = tier.upTo;
  }
  return total;
}`;

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-md gap-4 p-8">
      <AiArtifactCard title="Q2 launch plan" kind="document" meta="Markdown, 64 words" content={PLAN} filename="q2-launch-plan.md" onOpen={() => undefined} />
      <AiArtifactCard title="usageTotal()" kind="code" meta="TypeScript, 10 lines" content={CODE} filename="usage-total.ts" />
    </div>
  );
}
