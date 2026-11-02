import { ApiEndpoints } from "@rhs-ui/marketing/api-endpoints";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <p className="mb-8 text-xs text-muted-foreground">Fifteen endpoints in three resources: copy the base URL, then narrow the list with a method chip</p>
      <ApiEndpoints
        eyebrow="API"
        title="Everything the dashboard can do, over HTTP"
        description="Northwind is a plain JSON API over HTTPS. Authenticate with a secret key, send an idempotency key with any POST, and every response carries the request id you will want if you write to us."
        baseUrl="https://api.northwind.example/v1"
        docsHref="#reference"
        groups={[
          {
            label: "Customers",
            endpoints: [
              { method: "GET", path: "/customers", description: "List customers, newest first, fifty to a page.", href: "#list-customers" },
              { method: "POST", path: "/customers", description: "Create a customer from a name and an email address.", href: "#create-customer" },
              { method: "GET", path: "/customers/{customer_id}", description: "Retrieve one customer with their balance and default payment method.", href: "#retrieve-customer" },
              { method: "PATCH", path: "/customers/{customer_id}", description: "Change a customer's name, email address or default payment method.", href: "#update-customer" },
              { method: "DELETE", path: "/customers/{customer_id}", description: "Delete a customer and cancel their open invoices.", href: "#delete-customer" },
            ],
          },
          {
            label: "Invoices",
            description: "An invoice is a draft until you send it. After that it can be voided, but never deleted.",
            endpoints: [
              { method: "GET", path: "/invoices", description: "List invoices, filtered by customer, status or date.", href: "#list-invoices" },
              { method: "POST", path: "/invoices", description: "Draft an invoice with its line items and due date.", href: "#create-invoice" },
              { method: "GET", path: "/invoices/{invoice_id}", description: "Retrieve an invoice with its line items and payment attempts.", href: "#retrieve-invoice" },
              { method: "PATCH", path: "/invoices/{invoice_id}", description: "Edit a draft: change the lines, the due date or the memo.", href: "#update-invoice" },
              { method: "POST", path: "/invoices/{invoice_id}/send", description: "Email the invoice to the customer and mark it as sent.", href: "#send-invoice" },
              { method: "DELETE", path: "/invoices/{invoice_id}", description: "Delete a draft. A sent invoice is voided instead.", href: "#delete-invoice" },
            ],
          },
          {
            label: "Webhooks",
            endpoints: [
              { method: "GET", path: "/webhooks", description: "List the endpoints that receive your events.", href: "#list-webhooks" },
              { method: "POST", path: "/webhooks", description: "Subscribe a URL to the events you choose.", href: "#create-webhook" },
              { method: "PATCH", path: "/webhooks/:webhook_id", description: "Change a URL, or the events it listens to.", href: "#update-webhook" },
              { method: "DELETE", path: "/webhooks/:webhook_id", description: "Stop sending events to a URL.", href: "#delete-webhook" },
            ],
          },
        ]}
      />

      <p className="mt-20 mb-8 text-xs text-muted-foreground">A narrow column that starts on the POST chip: each row stacks as method and path, then the description</p>
      <div className="max-w-xl">
        <ApiEndpoints
          headingLevel={3}
          title="Take payments"
          description="Charge a card and refund it."
          defaultMethod="POST"
          groups={[
            {
              label: "Payments",
              endpoints: [
                { method: "GET", path: "/payments", description: "List payments, newest first.", href: "#list-payments" },
                { method: "POST", path: "/payments", description: "Create a payment and charge the customer's default card.", href: "#create-payment" },
                { method: "GET", path: "/payments/{payment_id}", description: "Retrieve a payment and its refunds.", href: "#retrieve-payment" },
                { method: "POST", path: "/payments/{payment_id}/refunds", description: "Refund all of a payment, or part of it.", href: "#refund-payment" },
              ],
            },
          ]}
        />
      </div>
    </div>
  );
}
