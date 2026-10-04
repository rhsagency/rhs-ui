import { StatsGrid } from "@rhs-ui/marketing/stats-grid";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <StatsGrid
        eyebrow="In numbers"
        title="Small team, steady results"
        stats={[
          { value: "4,200", label: "Stores on the platform", detail: "in 31 countries" },
          { value: "€1.9B", label: "Processed last year", detail: "up 64% year on year" },
          { value: "11 min", label: "Median support reply", detail: "seven days a week" },
          { value: "0.4%", label: "Monthly churn", detail: "average over 2025" },
        ]}
      />
    </div>
  );
}
