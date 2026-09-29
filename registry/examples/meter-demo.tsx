import { Meter } from "@rhs-ui/primitives/meter";

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-sm gap-6">
      <Meter label="Storage" value={42} max={100} high={75} critical={90} valueText="42 of 100 GB" />
      <Meter label="Seats" value={8} max={10} high={8} critical={10} valueText="8 of 10 seats" />
      <Meter label="API calls this month" value={96} max={100} high={75} critical={90} valueText="96,400 of 100,000" />
    </div>
  );
}
