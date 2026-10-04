"use client";

import { FeatureTabs } from "@rhs-ui/marketing/feature-tabs";

function Screen({ rows }: { rows: string[] }) {
  return (
    <div className="space-y-2 p-6 text-sm">
      {rows.map((row, index) => (
        <p key={row} className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
          {row}
          <span className="font-mono text-xs text-muted-foreground tabular-nums">{String(index + 1).padStart(2, "0")}</span>
        </p>
      ))}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <FeatureTabs
        eyebrow="How teams use it"
        title="Built for the way your week actually goes"
        tabs={[
          { id: "plan", label: "Plan", title: "A plan everyone can read", description: "Goals at the top, work underneath, and dates that move when the work moves.", points: ["Quarterly goals", "Linked tasks", "Automatic dates"], visual: <Screen rows={["Launch in Germany", "New onboarding", "Pricing experiment"]} /> },
          { id: "track", label: "Track", title: "Progress without the status meeting", description: "See what moved since yesterday in one glance, written by the work itself.", points: ["Daily digest", "Blocked items first"], visual: <Screen rows={["3 tasks done", "1 blocked by review", "2 due tomorrow"]} /> },
          { id: "review", label: "Review", title: "Decisions that stay findable", description: "Every decision with the reason and the people, linked to the work it changed.", visual: <Screen rows={["Use EU hosting only", "Drop the free trial", "Hire a support lead"]} /> },
        ]}
      />
    </div>
  );
}
