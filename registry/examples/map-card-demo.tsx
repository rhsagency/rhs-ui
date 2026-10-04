import { MapCard } from "@rhs-ui/primitives/map-card";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-md p-8">
      <MapCard name="Ledger Studio" address={["Oudegracht 210", "3511 NR Utrecht", "Netherlands"]} directionsHref="#directions" note="Open Monday to Friday, 9:00 to 18:00. Bike racks at the door." />
    </div>
  );
}
