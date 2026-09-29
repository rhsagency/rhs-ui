import { OrderSummary } from "@rhs-ui/commerce/order-summary";
import { Button } from "@rhs-ui/primitives/button";

const eur = (amount: number) => ({ amount, currency: "EUR" });

export default function OrderSummaryDemo() {
  return (
    <OrderSummary
      className="w-full max-w-sm"
      rows={[
        { label: "Subtotal (3 items)", value: eur(16700) },
        { label: "Discount WELCOME10", value: eur(-1670) },
        { label: "Shipping", value: eur(0), freeLabel: "Free" },
        { label: "Tax", value: null },
      ]}
      total={eur(15030)}
      note="Including VAT where it applies"
    >
      <Button className="w-full">Continue to payment</Button>
    </OrderSummary>
  );
}
