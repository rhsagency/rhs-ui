import { Gauge } from "@rhs-ui/dashboard/gauge";

export default function Demo(): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-end justify-center gap-10">
      <Gauge value={72} label="Net Promoter Score" valueText="72" />
      <Gauge value={81} label="CPU load" valueText="81%" high={70} critical={90} size={150} />
      <Gauge value={96} label="Quota used" valueText="96%" high={75} critical={90} size={150} />
    </div>
  );
}
