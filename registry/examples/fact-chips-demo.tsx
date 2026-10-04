import { IconClock, IconDumbbell, IconParking, IconShower, IconUsers } from "@rhs-ui/icons";
import { FactChips } from "@rhs-ui/primitives/fact-chips";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-xl gap-6 p-6">
      <FactChips
        label="Class details"
        facts={[
          { icon: <IconClock />, label: "60 min" },
          { icon: <IconUsers />, label: "Up to 12 people" },
          { icon: <IconDumbbell />, label: "All levels" },
          { icon: <IconShower />, label: "Showers" },
          { icon: <IconParking />, label: "Free parking" },
        ]}
      />
      <FactChips size="sm" facts={[{ icon: <IconClock />, label: "45 min" }, { icon: <IconUsers />, label: "Small group" }]} />
    </div>
  );
}
