import { LineChart } from "@rhs-ui/dashboard/line-chart";

const MONTHS = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
const DATA = MONTHS.map((month, i) => ({ month, revenue: Math.round(38000 + i * 2400 + Math.sin(i * 1.3) * 3500), costs: Math.round(29000 + i * 900 + Math.cos(i * 0.9) * 2200) }));

export default function Demo(): React.JSX.Element {
  return (
    <div className="w-full max-w-2xl">
      <LineChart data={DATA} index="month" series={[{ key: "revenue", label: "Revenue" }, { key: "costs", label: "Costs" }]} format={{ style: "currency", currency: "EUR", notation: "compact", maximumFractionDigits: 1 }} locale="en-IE" label="Revenue and costs, last twelve months" />
    </div>
  );
}
