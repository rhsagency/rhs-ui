import { CheckoutSteps } from "@rhs-ui/commerce/checkout-steps";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-2xl p-8">
      <CheckoutSteps current={2} steps={[{ id: "bag", label: "Bag", href: "#bag" }, { id: "details", label: "Details", href: "#details" }, { id: "shipping", label: "Shipping" }, { id: "payment", label: "Payment" }]} />
    </div>
  );
}
