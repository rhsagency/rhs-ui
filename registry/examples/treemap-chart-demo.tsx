import { TreemapChart } from "@rhs-ui/dashboard/treemap-chart";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-2xl p-8">
      <TreemapChart
        label="Cloud spend by service, March"
        format={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }}
        items={[
          { id: "compute", label: "Compute", value: 18400 },
          { id: "db", label: "Database", value: 9600 },
          { id: "storage", label: "Storage", value: 5200 },
          { id: "cdn", label: "CDN", value: 3900 },
          { id: "search", label: "Search", value: 2600 },
          { id: "queue", label: "Queues", value: 1400 },
          { id: "logs", label: "Logs", value: 1100 },
          { id: "dns", label: "DNS", value: 300 },
        ]}
      />
    </div>
  );
}
