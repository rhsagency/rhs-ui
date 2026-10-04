import { DeliveryEstimate } from "@rhs-ui/commerce/delivery-estimate";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-sm p-8">
      <DeliveryEstimate
        cutoff="Order within 2 h 14 min"
        options={[
          { id: "standard", kind: "delivery", when: "Tomorrow", how: "Home delivery, 9:00 to 18:00", cost: "Free" },
          { id: "evening", kind: "delivery", when: "Tomorrow evening", how: "Home delivery, 18:00 to 22:00", cost: "€4.95" },
          { id: "pickup", kind: "pickup", when: "Thursday 17 April", how: "Pick up at the Utrecht store", cost: "Free" },
        ]}
      />
    </div>
  );
}
