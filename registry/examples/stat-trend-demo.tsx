import { StatTrend } from "@rhs-ui/dashboard/stat-trend";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-4xl gap-4 p-8 sm:grid-cols-3">
      <StatTrend label="Revenue" value="€48,200" change={0.12} trend={[31, 34, 33, 38, 41, 40, 44, 48]} />
      <StatTrend label="Active customers" value="1,284" change={0.04} trend={[1180, 1201, 1215, 1230, 1242, 1260, 1271, 1284]} />
      <StatTrend label="Churn" value="2.8%" change={0.09} upIsGood={false} trend={[2.3, 2.4, 2.4, 2.5, 2.6, 2.6, 2.7, 2.8]} />
    </div>
  );
}
