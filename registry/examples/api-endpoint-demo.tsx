import { ApiEndpoint } from "@rhs-ui/application/api-endpoint";

const BASE = "https://api.northwind.dev";

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl gap-4">
      <div>
        <h2 className="text-base font-semibold tracking-[-0.02em]">Orders</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every route hangs from <code className="font-mono text-[0.8125rem] text-foreground">{BASE}</code>. The copy button copies the whole address.
        </p>
      </div>
      <div className="grid gap-2.5">
        <ApiEndpoint method="GET" path="/v1/orders" baseUrl={BASE} href="#list-orders" auth="Bearer token" description="List orders, newest first. Filter by status or customer; 50 per page." />
        <ApiEndpoint
          method="POST"
          path="/v1/orders"
          baseUrl={BASE}
          href="#create-order"
          auth="Bearer token"
          description="Create an order from a cart. Send an Idempotency-Key header, so a retry never charges twice."
        />
        <ApiEndpoint method="GET" path="/v1/orders/:id" baseUrl={BASE} href="#get-order" auth="Bearer token" description="Retrieve one order with its line items, shipments and refunds." />
        <ApiEndpoint
          method="GET"
          path="/v1/orders/:id/events?limit=20"
          baseUrl={BASE}
          href="#order-events"
          auth="Bearer token · orders:read"
          description="The history of an order, newest first: paid, packed, shipped, delivered."
        />
        <ApiEndpoint
          method="PUT"
          path="/v1/orders/{id}/shipping-address"
          baseUrl={BASE}
          href="#replace-address"
          auth="Bearer token · orders:write"
          description="Replace the shipping address of an order that has not shipped yet."
        />
        <ApiEndpoint
          method="PATCH"
          path="/v1/orders/{id}"
          baseUrl={BASE}
          href="#update-order"
          auth="API key"
          description="Change the note, the tags or the metadata. Fields you leave out stay as they are."
        />
        <ApiEndpoint
          method="DELETE"
          path="/v1/orders/:id"
          baseUrl={BASE}
          href="#delete-order"
          deprecated
          auth="Bearer token"
          description="Use POST /v1/orders/:id/cancel instead. This route stops working on 1 March 2027."
        />
        <ApiEndpoint method="GET" path="/v1/status" baseUrl={BASE} href="#status" auth={false} description="The health of the API. Safe to poll every ten seconds." />
      </div>
    </div>
  );
}
