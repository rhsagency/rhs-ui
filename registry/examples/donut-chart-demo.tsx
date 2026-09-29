import { DonutChart } from "@rhs-ui/dashboard/donut-chart";

export default function Demo(): React.JSX.Element {
  return (
    <DonutChart
      label="Revenue by plan, September"
      format={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }} locale="en-IE"
      data={[
        { label: "Pro", value: 28400 },
        { label: "All-access", value: 19600 },
        { label: "Team", value: 11200 },
        { label: "Agency", value: 5600 },
      ]}
    />
  );
}
