import { StackedBar } from "@rhs-ui/dashboard/stacked-bar";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8 p-8">
      <StackedBar label="Traffic by source" segments={[{ label: "Search", value: 5820 }, { label: "Direct", value: 3110 }, { label: "Social", value: 1450 }, { label: "Email", value: 920 }]} />
      <StackedBar label="Storage used" segments={[{ label: "Video", value: 41 }, { label: "Images", value: 22 }, { label: "Documents", value: 9 }]} />
    </div>
  );
}
