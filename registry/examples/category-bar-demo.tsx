import { CategoryBar } from "@rhs-ui/dashboard/category-bar";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-md gap-8 p-8">
      <CategoryBar label="Account health" value={72} bands={[{ to: 40, label: "At risk" }, { to: 70, label: "Watch" }, { to: 90, label: "Healthy" }, { to: 100, label: "Champion" }]} />
      <CategoryBar label="Performance score" value={94} bands={[{ to: 49, label: "Poor" }, { to: 89, label: "Needs work" }, { to: 100, label: "Good" }]} />
    </div>
  );
}
