import { Fragment } from "react";

import { CellPreviewPopover } from "@rhs-ui/primitives/cell-preview-popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";

export default function Demo(): React.JSX.Element {
  return (
    <div className="@container grid w-full max-w-3xl gap-3">
      <p className="text-xs text-muted-foreground">Each cell shows two lines. Where there is more, a small mark appears, and opening the cell shows all of it with Copy. The short ones show whole and still copy.</p>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <Table className="table-fixed text-xs @xl:text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[26%] @xl:w-[21%]">Event</TableHead>
              <TableHead className="hidden w-[27%] @xl:table-cell">Endpoint</TableHead>
              <TableHead className="w-[38%] @xl:w-[27%]">Payload</TableHead>
              <TableHead>Response</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {DELIVERIES.map((delivery) => (
              <TableRow key={delivery.id} className="align-top">
                <TableCell className="align-top">
                  <span className="grid gap-0.5 py-1">
                    <span className="font-medium">
                      {delivery.event.split(".").map((part, index) => (
                        <Fragment key={part}>
                          {index > 0 ? (
                            <>
                              .<wbr />
                            </>
                          ) : null}
                          {part}
                        </Fragment>
                      ))}
                    </span>
                    <span className="font-mono text-[0.6875rem] text-muted-foreground [overflow-wrap:anywhere] @max-xl:hidden">{delivery.id}</span>
                  </span>
                </TableCell>
                <TableCell className="hidden align-top @xl:table-cell">
                  <CellPreviewPopover value={delivery.endpoint} kind="url" title="Endpoint" className="font-mono text-xs text-muted-foreground" />
                </TableCell>
                <TableCell className="align-top">
                  <CellPreviewPopover value={delivery.payload} kind="json" title="Payload" className="text-muted-foreground" />
                </TableCell>
                <TableCell className="align-top">
                  <CellPreviewPopover value={delivery.response} kind="text" title="Response" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/** What the table shows: deliveries of a webhook, some that went through and some that did not. */
const DELIVERIES = [
  {
    id: "evt_1Qa8Zr",
    event: "order.paid",
    endpoint: "https://hooks.northwind.example/halcyon/orders/paid?source=storefront&region=eu-west&attempt=1",
    payload: {
      id: "ord_20481",
      customer: { id: "cus_8Hq2xN9v", email: "mara.okafor@kestrel.example" },
      amount: 18420,
      currency: "eur",
      items: [
        { sku: "HX-204", quantity: 2 },
        { sku: "HX-311", quantity: 1 },
      ],
      metadata: { campaign: "autumn-2026", gift: false },
    },
    response: "200 OK in 41 ms",
  },
  {
    id: "evt_1Qa9Kd",
    event: "invoice.failed",
    endpoint: "https://api.kestrel.example/v2/billing/webhooks/inbound",
    payload: { id: "inv_7731", attempt: 3, reason: "card_declined", retryAt: "2026-11-10T21:15:00Z" },
    response: "Connection refused: the host at 10.4.22.7 did not accept a connection on port 443 after 3 tries. The delivery will be tried again in 15 minutes.",
  },
  {
    id: "evt_1QaaMn",
    event: "customer.updated",
    endpoint: "https://hooks.slack.example/services/T01HX/B02KE/9fT3",
    payload: { id: "cus_3Lm0pQ", changed: ["phone"] },
    response: "OK",
  },
  {
    id: "evt_1QabPw",
    event: "refund.created",
    endpoint: "https://hooks.northwind.example/halcyon/refunds",
    payload: { id: "re_9031", order: "ord_20407", amount: 2400, reason: "requested_by_customer", restock: true, items: [{ sku: "HX-311", quantity: 1 }] },
    response: "200 OK in 57 ms",
  },
  {
    id: "evt_1QacTz",
    event: "subscription.renewed",
    endpoint: "https://api.kestrel.example/v2/events",
    payload: { id: "sub_5521", plan: "team", seats: 18, renewsOn: "2027-11-10" },
    response: "Timeout after 10 seconds: api.kestrel.example did not answer. The delivery will be tried 4 more times, the next one in 5 minutes.",
  },
] as const;
