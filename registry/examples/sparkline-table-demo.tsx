import { SparklineTable } from "@rhs-ui/dashboard/sparkline-table";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-2xl p-8">
      <SparklineTable
        label="Revenue by product, last 12 weeks"
        columns={["Product", "12 weeks", "This week", "Change"]}
        rows={[
          { id: "1", name: "Linen apron", series: [12, 14, 13, 15, 18, 17, 19, 22, 21, 24, 26, 27], value: "€4,212", change: 0.08 },
          { id: "2", name: "Stoneware mug", series: [30, 28, 29, 27, 26, 27, 25, 24, 23, 24, 22, 21], value: "€2,904", change: -0.05 },
          { id: "3", name: "Canvas tote", series: [8, 9, 9, 10, 9, 11, 12, 12, 13, 13, 14, 15], value: "€1,630", change: 0.07 },
          { id: "4", name: "Returns", series: [3, 3, 4, 3, 5, 4, 5, 6, 5, 6, 7, 7], value: "€410", change: 0.12, upIsGood: false },
        ]}
      />
    </div>
  );
}
