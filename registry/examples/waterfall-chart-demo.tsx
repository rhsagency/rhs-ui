import { WaterfallChart } from "@rhs-ui/dashboard/waterfall-chart";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-2xl p-8">
      <WaterfallChart
        label="Monthly recurring revenue, February to March"
        format={{ style: "currency", currency: "EUR", maximumFractionDigits: 0, notation: "compact" }}
        steps={[
          { id: "start", label: "Feb MRR", value: 48200 },
          { id: "new", label: "New", value: 6400 },
          { id: "expansion", label: "Expansion", value: 2100 },
          { id: "contraction", label: "Contraction", value: -900 },
          { id: "churn", label: "Churn", value: -2300 },
          { id: "end", label: "Mar MRR", value: 0, total: true },
        ]}
      />
    </div>
  );
}
