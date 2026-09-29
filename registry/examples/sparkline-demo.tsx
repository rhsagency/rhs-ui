import { Sparkline } from "@rhs-ui/dashboard/sparkline";

const ROWS = [
  { name: "Revenue", value: "€64,800", trend: [38, 41, 36, 44, 47, 45, 52, 55, 53, 58, 61, 65], change: "+18%" },
  { name: "Active users", value: "12,480", trend: [80, 82, 85, 83, 88, 92, 95, 94, 99, 104, 108, 112], change: "+32%" },
  { name: "Churn", value: "1.8%", trend: [3.1, 2.9, 3, 2.7, 2.5, 2.6, 2.3, 2.2, 2, 2.1, 1.9, 1.8], change: "−1.3 pts" },
];

export default function Demo(): React.JSX.Element {
  return (
    <ul className="grid w-full max-w-md divide-y divide-border rounded-xl border border-border">
      {ROWS.map((row) => (
        <li key={row.name} className="flex items-center justify-between gap-4 px-4 py-3">
          <span className="grid">
            <span className="text-sm text-muted-foreground">{row.name}</span>
            <span className="text-lg font-semibold tabular-nums">{row.value}</span>
          </span>
          <Sparkline values={row.trend} label={`${row.name}, last twelve months, ${row.change}`} />
          <span className="w-16 text-right text-xs tabular-nums text-muted-foreground">{row.change}</span>
        </li>
      ))}
    </ul>
  );
}
