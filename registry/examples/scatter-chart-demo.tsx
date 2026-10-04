"use client";

import { ScatterChart } from "@rhs-ui/dashboard/scatter-chart";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-2xl p-8">
      <ScatterChart
        label="Feature requests by effort and votes"
        xLabel="Effort (days)"
        yLabel="Votes"
        points={[
          { id: "1", label: "Dark mode", x: 4, y: 320, size: 40 },
          { id: "2", label: "SSO", x: 12, y: 210, size: 90 },
          { id: "3", label: "CSV import", x: 3, y: 150, size: 20 },
          { id: "4", label: "Mobile app", x: 40, y: 410, size: 120 },
          { id: "5", label: "Webhooks", x: 6, y: 90, size: 30 },
          { id: "6", label: "Gantt view", x: 25, y: 260, size: 60 },
          { id: "7", label: "Audit log", x: 9, y: 70, size: 50 },
        ]}
      />
    </div>
  );
}
