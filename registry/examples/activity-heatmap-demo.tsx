import { ActivityHeatmap, type HeatmapDay } from "@rhs-ui/dashboard/activity-heatmap";

/** A fixed pattern: busier midweek, quiet weekends, a launch spike. */
const DAYS: HeatmapDay[] = Array.from({ length: 182 }, (_, i) => {
  const date = new Date(Date.UTC(2026, 8, 28) - i * 86400000);
  const weekday = date.getUTCDay();
  const base = weekday === 0 || weekday === 6 ? 1 : 4 + ((i * 7) % 5);
  return { date: date.toISOString().slice(0, 10), value: i % 23 === 4 ? 0 : i < 14 ? base + 6 : base };
});

export default function Demo(): React.JSX.Element {
  return (
    <div className="w-full max-w-3xl">
      <ActivityHeatmap days={DAYS} unit="deploys" end="2026-09-28" weeks={26} label="Deploys, last six months" />
    </div>
  );
}
