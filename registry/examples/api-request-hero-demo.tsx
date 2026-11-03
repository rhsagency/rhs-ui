import { ApiRequestHero } from "@rhs-ui/marketing/api-request-hero";

const json = (value: unknown) => JSON.stringify(value, null, 2);

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <p className="pt-6 text-xs text-muted-foreground">A successful call: the status, the latency and the line that matters.</p>
      <ApiRequestHero
        eyebrow="Northwind Shipping API"
        title="Ship a parcel with one request."
        description="Send an address and a weight. Northwind picks the carrier, buys the label and hands back a tracking link. No contracts, no SOAP."
        install="npm install @northwind/shipping"
        docsHref="#reference"
        className="py-8 sm:py-10"
        request={{
          method: "POST",
          url: "https://api.northwind.dev/v1/shipments",
          language: "json",
          body: json({
            from: "ams-01",
            to: { city: "Lyon", country: "FR" },
            weight_kg: 2.4,
            service: "express",
          }),
        }}
        response={{
          status: "201 Created",
          ms: 214,
          language: "json",
          highlight: [6],
          body: json({
            id: "shp_4f9c2a",
            status: "label_created",
            carrier: "dhl-express",
            eta: "2026-11-05",
            track: "https://nw.dev/t/4f9c2a",
          }),
        }}
      />

      <p className="border-t border-border pt-6 text-xs text-muted-foreground">A failed call: a request without a body, and a status that turns destructive and says so in words.</p>
      <ApiRequestHero
        eyebrow="Errors"
        title="Failures that explain themselves."
        description="Every error carries a code, a plain message and a link to the fix, so a bad id never costs anyone an afternoon."
        install="npm install @northwind/shipping"
        docsHref="#errors"
        docsLabel="Browse the error codes"
        className="py-8 sm:py-10"
        request={{ method: "GET", url: "https://api.northwind.dev/v1/shipments/shp_0000" }}
        response={{
          status: "404 Not Found",
          ms: 38,
          language: "json",
          body: json({
            error: {
              code: "shipment_not_found",
              message: "Unknown shipment id.",
              doc: "https://nw.dev/e/404",
            },
          }),
        }}
      />
    </div>
  );
}
