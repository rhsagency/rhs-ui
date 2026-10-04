import { IconCrown, IconMedal, IconTrophy } from "@rhs-ui/icons";
import { AwardsRow } from "@rhs-ui/marketing/awards-row";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <AwardsRow
        title="Recognition"
        awards={[
          { title: "Product of the Day", by: "Maker community", year: "2026", icon: <IconTrophy /> },
          { title: "Best Workplace Tool", by: "Workplace Review", year: "2025", icon: <IconMedal /> },
          { title: "Design Award, Software", by: "Dutch Design Prize", year: "2025" },
          { title: "Leader, Project Management", by: "Buyer's Guide", year: "2026", icon: <IconCrown /> },
        ]}
      />
    </div>
  );
}
