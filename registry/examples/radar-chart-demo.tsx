import { RadarChart } from "@rhs-ui/dashboard/radar-chart";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-md p-8">
      <RadarChart
        label="Plan comparison, scored out of 10"
        index="axis"
        max={10}
        series={[{ key: "team", label: "Team" }, { key: "starter", label: "Starter" }]}
        data={[
          { axis: "Speed", team: 9, starter: 7 },
          { axis: "Security", team: 8, starter: 5 },
          { axis: "Integrations", team: 9, starter: 4 },
          { axis: "Support", team: 7, starter: 4 },
          { axis: "Reporting", team: 8, starter: 3 },
          { axis: "Price", team: 6, starter: 10 },
        ]}
      />
    </div>
  );
}
