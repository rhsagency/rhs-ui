import { MetricDelta } from "@rhs-ui/primitives/metric-delta";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-sm gap-4 p-8 text-sm">
      <p className="flex items-center justify-between">Revenue <span className="flex items-center gap-2 font-medium">€48,200 <MetricDelta change={0.124} period="vs last week" /></span></p>
      <p className="flex items-center justify-between">Churn <span className="flex items-center gap-2 font-medium">2.8% <MetricDelta change={0.09} upIsGood={false} /></span></p>
      <p className="flex items-center justify-between">Page load <span className="flex items-center gap-2 font-medium">1.2 s <MetricDelta change={-0.18} upIsGood={false} /></span></p>
      <p className="flex items-center justify-between">Signups <span className="flex items-center gap-2 font-medium">312 <MetricDelta change={0} /></span></p>
    </div>
  );
}
