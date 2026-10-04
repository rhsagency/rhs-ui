import { OpeningHours } from "@rhs-ui/primitives/opening-hours";
import { LocationSection } from "@rhs-ui/marketing/location-section";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-6">
      <LocationSection
        title="Visit the showroom"
        name="Hout Design Veenendaal"
        address={["Industrieweg 12", "3901 AB Veenendaal", "Netherlands"]}
        phone="+31 318 123 456"
        email="info@example.com"
        directionsHref="#directions"
        aside={<OpeningHours days={[{ day: "Mon to Fri", hours: "09:00 to 17:30" }, { day: "Saturday", hours: "10:00 to 16:00" }, { day: "Sunday", hours: null }]} />}
      />
    </div>
  );
}
