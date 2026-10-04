import { MetricComparison } from "@rhs-ui/dashboard/metric-comparison";

const number = (value: number) => value.toLocaleString("en-GB");

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-xl p-8">
      <MetricComparison
        title="March against February"
        format={number}
        rows={[
          { label: "Orders", current: 1842, previous: 1610 },
          { label: "Returns", current: 96, previous: 71, upIsGood: false },
          { label: "New customers", current: 512, previous: 540 },
          { label: "Support tickets", current: 230, previous: 288, upIsGood: false },
        ]}
      />
    </div>
  );
}
