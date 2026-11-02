import type { ReactNode } from "react";

import { StackLayers } from "@rhs-ui/marketing/stack-layers";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="mb-8 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Example caption="Four layers in the order a request meets them: each with its technologies, a promise you could hold it to and one number. The rail on the left is the path of the request">
        <StackLayers
          eyebrow="Architecture"
          title="Four layers between a visitor and your data"
          description="Every request crosses the same four layers, in the same order. Each one has a job and a number we hold ourselves to."
          layers={[
            {
              id: "edge",
              name: "Edge",
              technologies: ["Anycast network", "HTTP/3", "TLS 1.3", "DDoS filtering"],
              promise: "Requests are answered within 50 ms of the visitor, and attacks are stopped before they reach us.",
              metric: { value: "38 ms", label: "median to first byte" },
            },
            {
              id: "api",
              name: "API",
              technologies: ["Rust", "gRPC", "GraphQL", "OAuth 2.1"],
              promise: "Every call is authenticated, rate-limited and logged before it gets near your data.",
              metric: { value: "99.99%", label: "uptime over the last 12 months" },
            },
            {
              id: "compute",
              name: "Compute",
              technologies: ["Firecracker microVMs", "Kubernetes", "Job queues"],
              promise: "Workloads scale from zero to thousands in seconds, each one inside its own sandbox.",
              metric: { value: "1.2 s", label: "median cold start" },
            },
            {
              id: "storage",
              name: "Storage",
              technologies: ["PostgreSQL", "Object storage", "Redis"],
              promise: "Three copies in three zones, encrypted at rest with keys that only you control.",
              metric: { value: "11 nines", label: "annual durability" },
            },
          ]}
          footnote="Figures are medians over the last 90 days and are published live on our status page."
        />
      </Example>

      <div className="mx-auto mt-20 max-w-md border-t border-border pt-12 sm:mt-24">
        <Example caption="A shorter stack in a narrow column: the bands become cards joined by a short line, and a layer may have no number">
          <StackLayers
            headingLevel={3}
            title="Under the hood of your shop"
            layers={[
              {
                id: "storefront",
                name: "Storefront",
                technologies: ["Edge cache", "Image CDN"],
                promise: "Pages come from the nearest of 280 locations.",
                metric: { value: "120 ms", label: "median page load" },
              },
              {
                id: "checkout",
                name: "Checkout",
                technologies: ["3-D Secure", "Tokenised cards"],
                promise: "A payment is confirmed before an order exists, so there are no half-orders to clean up.",
              },
              {
                id: "fulfilment",
                name: "Fulfilment",
                technologies: ["Webhooks", "Label printing"],
                promise: "A paid order reaches the warehouse as a pick list within seconds.",
                metric: { value: "4 s", label: "order to pick list" },
              },
            ]}
          />
        </Example>
      </div>
    </div>
  );
}
