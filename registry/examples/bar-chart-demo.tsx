import { BarChart } from "@rhs-ui/dashboard/bar-chart";

const QUARTERS = [
  { quarter: "Q1", new: 42, expansion: 18, churned: 6 },
  { quarter: "Q2", new: 51, expansion: 22, churned: 8 },
  { quarter: "Q3", new: 64, expansion: 27, churned: 7 },
  { quarter: "Q4", new: 73, expansion: 35, churned: 9 },
];
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => ({ day, orders: [124, 168, 152, 190, 230, 96, 74][i]! }));

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-2xl gap-10">
      <BarChart data={QUARTERS} index="quarter" series={[{ key: "new", label: "New" }, { key: "expansion", label: "Expansion" }, { key: "churned", label: "Churned" }]} stacked label="Accounts per quarter" />
      <BarChart data={WEEK} index="day" series={[{ key: "orders", label: "Orders" }]} label="Orders this week" height={180} />
    </div>
  );
}
