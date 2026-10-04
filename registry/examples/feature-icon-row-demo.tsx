import { IconHeadphones, IconRefresh, IconShieldCheck, IconTruck } from "@rhs-ui/icons";
import { FeatureIconRow } from "@rhs-ui/marketing/feature-icon-row";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <FeatureIconRow
        items={[
          { icon: <IconTruck />, title: "Free delivery", description: "On orders over €50, next day in the Netherlands" },
          { icon: <IconRefresh />, title: "30-day returns", description: "Free, with a label in the box" },
          { icon: <IconShieldCheck />, title: "Five-year warranty", description: "On every lamp and frame" },
          { icon: <IconHeadphones />, title: "Real people", description: "Support in Dutch and English, 8:00 to 20:00" },
        ]}
      />
    </div>
  );
}
