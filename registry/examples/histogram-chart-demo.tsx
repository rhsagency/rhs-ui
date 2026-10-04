import { HistogramChart } from "@rhs-ui/dashboard/histogram-chart";

/** A fixed, made-up sample: response times in milliseconds. */
const SAMPLE = Array.from({ length: 240 }, (_, i) => {
  const base = 120 + Math.sin(i * 1.7) * 40 + Math.cos(i * 0.37) * 35;
  return Math.round(base + (i % 17 === 0 ? 220 : 0) + (i % 5) * 6);
});

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-2xl p-8">
      <HistogramChart label="API response times, last hour" values={SAMPLE} unit="ms" bins={14} marker={{ value: 250, label: "Target" }} />
    </div>
  );
}
