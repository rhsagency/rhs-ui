import { PaymentMethods } from "@rhs-ui/commerce/payment-methods";
import { Button } from "@rhs-ui/primitives/button";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-sm gap-4 p-8">
      <Button size="lg" className="w-full">Pay €87.00</Button>
      <PaymentMethods note="Secure checkout, encrypted end to end" methods={["iDEAL", "Bancontact", "Visa", "Mastercard", "PayPal", "Apple Pay", "Klarna"]} />
    </div>
  );
}
