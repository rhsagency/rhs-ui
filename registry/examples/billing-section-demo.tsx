import { Button } from "@rhs-ui/primitives/button";
import { BillingSection } from "@rhs-ui/application/billing-section";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-4xl p-8">
      <BillingSection
        plan={{ name: "Team", price: "€49 per month", renews: "Renews on 1 May 2026" }}
        paymentMethod="Visa ending 4242, expires 08/28"
        planActions={<><Button size="sm">Change plan</Button><Button size="sm" variant="ghost">Cancel plan</Button></>}
        onUpdatePayment={<Button size="sm" variant="outline">Update card</Button>}
        invoices={[
          { id: "INV-2026-0412", date: "1 April 2026", dateTime: "2026-04-01", amount: "€49.00", status: "open", href: "#inv-0412" },
          { id: "INV-2026-0311", date: "1 March 2026", dateTime: "2026-03-01", amount: "€49.00", status: "paid", href: "#inv-0311" },
          { id: "INV-2026-0210", date: "1 February 2026", dateTime: "2026-02-01", amount: "€49.00", status: "failed", href: "#inv-0210" },
          { id: "INV-2026-0109", date: "1 January 2026", dateTime: "2026-01-01", amount: "€29.00", status: "paid", href: "#inv-0109" },
        ]}
      />
    </div>
  );
}
