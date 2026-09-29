import { FunnelChart } from "@rhs-ui/dashboard/funnel-chart";

export default function Demo(): React.JSX.Element {
  return (
    <div className="w-full max-w-xl">
      <FunnelChart
        label="Sign-up funnel, September"
        steps={[
          { label: "Visited pricing", value: 18400 },
          { label: "Started sign-up", value: 6210 },
          { label: "Verified email", value: 4870 },
          { label: "Started a trial", value: 2130 },
          { label: "Paid", value: 612 },
        ]}
      />
    </div>
  );
}
