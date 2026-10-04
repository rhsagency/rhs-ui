"use client";

import { FeatureAccordionMedia } from "@rhs-ui/marketing/feature-accordion-media";

function Screen({ label, bars }: { label: string; bars: number[] }): React.JSX.Element {
  return (
    <div className="flex h-full flex-col justify-end gap-4 p-8">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex h-40 items-end gap-2">
        {bars.map((bar, index) => (
          <span key={index} className="flex-1 rounded-t-md bg-foreground/80" style={{ height: `${bar}%` }} />
        ))}
      </div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <FeatureAccordionMedia
        title="Reporting that answers the next question too."
        description="Every chart opens into the rows behind it, so a number never ends the conversation."
        features={[
          { id: "revenue", title: "Revenue by week", description: "See what came in, what is booked and what is at risk, per week and per plan.", visual: <Screen label="Revenue, last 8 weeks" bars={[40, 52, 48, 61, 58, 70, 74, 82]} /> },
          { id: "churn", title: "Churn you can explain", description: "Every cancelled account with its reason, its plan and the last thing it did.", visual: <Screen label="Cancellations by reason" bars={[70, 44, 30, 18, 12]} /> },
          { id: "cohorts", title: "Cohorts in one click", description: "Group customers by the month they joined and watch how each group holds on.", visual: <Screen label="Retention by cohort" bars={[100, 82, 74, 70, 66, 64]} /> },
        ]}
      />
    </div>
  );
}
