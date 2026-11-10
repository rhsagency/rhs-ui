import { BenchmarkBars } from "@rhs-ui/marketing/benchmark-bars";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-6xl gap-14 px-6 py-6">
      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          Four metrics, each with your customers' bar and the industry median on one scale, both values at the bar ends and the multiple in words, worked out from the same numbers. Where lower is better the shorter bar wins and a note says so. Each metric is a figure whose caption a screen reader hears in full; a row below the window grows its bars once as it scrolls into view, and one already in view stands still.
        </figcaption>
        <BenchmarkBars
          title="Halcyon customers against the industry median"
          description="Same quarter, same measures, 2,100 customers against 640 operators."
          metrics={[
            {
              id: "publish",
              label: "Time to publish a weekly schedule",
              ours: { value: 25, label: "25 min" },
              benchmark: { value: 186, label: "3 h 6 min" },
              better: "lower",
              comparative: "faster",
            },
            {
              id: "missed",
              label: "Shifts missed without notice",
              ours: { value: 1.2 },
              benchmark: { value: 3.4 },
              unit: "%",
              better: "lower",
              comparative: "fewer",
            },
            {
              id: "adoption",
              label: "Staff using the app after 30 days",
              ours: { value: 94 },
              benchmark: { value: 61 },
              unit: "%",
              better: "higher",
            },
            {
              id: "changes",
              label: "Schedule changes handled without a manager",
              ours: { value: 87 },
              benchmark: { value: 52 },
              unit: "%",
              better: "higher",
              comparative: "more",
            },
          ]}
          source="Halcyon platform data for 2,100 customers, third quarter of 2026, against the 2026 Workforce Benchmark of 640 operators (median)."
          methodHref="#method"
          className="py-2 sm:py-4"
        />
      </figure>

      <figure className="grid gap-3 border-t border-border pt-10">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          The words follow the numbers, whoever wins: a result within 5 percent is "in line", and one that trails the median is described as it is, with no flattering adjective. The source sits on another site here, so its link says that it opens in a new tab.
        </figcaption>
        <BenchmarkBars
          title="Where we lead and where we trail"
          metrics={[
            {
              id: "price",
              label: "Price per seat, per month",
              ours: { value: 9, label: "$9" },
              benchmark: { value: 14, label: "$14" },
              better: "lower",
              comparative: "cheaper",
            },
            {
              id: "uptime",
              label: "Uptime over twelve months",
              ours: { value: 99.98 },
              benchmark: { value: 99.97 },
              unit: "%",
              better: "higher",
            },
            {
              id: "integrations",
              label: "Ready-made integrations",
              ours: { value: 140 },
              benchmark: { value: 220 },
              better: "higher",
            },
          ]}
          source="Public price lists and status pages of 38 vendors, collected in October 2026."
          methodHref="https://example.com/benchmark-method"
          labels={{ ours: "Halcyon", benchmark: "Median of 38 vendors" }}
          className="py-2 sm:py-4"
        />
      </figure>
    </div>
  );
}
