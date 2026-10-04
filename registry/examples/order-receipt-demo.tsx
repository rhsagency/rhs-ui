import { OrderReceipt } from "@rhs-ui/commerce/order-receipt";
import { Button } from "@rhs-ui/primitives/button";

export default function Demo(): React.JSX.Element {
  return (
    <div className="p-8">
      <OrderReceipt
        orderNumber="LD-20418"
        placedAt="14 April 2026, 10:42"
        placedAtDateTime="2026-04-14T10:42"
        email="a.dewit@example.com"
        lines={[
          { id: "1", title: "Linen apron", variant: "Stone, M", quantity: 1, price: { amount: 3900, currency: "EUR" } },
          { id: "2", title: "Stoneware mug", variant: "Set of 2", quantity: 2, price: { amount: 2400, currency: "EUR" } },
        ]}
        shipping={{ amount: 0, currency: "EUR" }}
        vatIncluded={{ amount: 1509, currency: "EUR" }}
        paidWith="Visa ending 4242"
        shipTo={["Anouk de Wit", "Oudegracht 210", "3511 NR Utrecht", "Netherlands"]}
        actions={<><Button>Track your order</Button><Button variant="outline">Download invoice</Button></>}
      />
    </div>
  );
}
