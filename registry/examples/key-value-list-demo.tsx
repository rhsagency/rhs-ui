import type { ReactNode } from "react";

import { KeyValueList, type KeyValueItem } from "@rhs-ui/primitives/key-value-list";

const ENDPOINT = "https://api.northwind.example/v2/orders/ord_9F3K27XQ/events";

// The order id links to a page of this app, the endpoint to another site: only that one carries the arrow.
const ITEMS: readonly KeyValueItem[] = [
  { label: "Order ID", value: "ord_9F3K27XQ", mono: true, copyable: true, href: "#orders/ord_9F3K27XQ" },
  { label: "Events endpoint", value: ENDPOINT, mono: true, copyable: true, href: ENDPOINT, tail: 19 },
  { label: "Webhook secret", value: "whsec_7f4c91d2a8b34e6f90c1d57b", mono: true, secret: true, copyable: true },
  { label: "SHA-256", value: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", mono: true, copyable: true },
  { label: "Created", value: "28 Oct 2026, 14:07 UTC" },
  { label: "Region", value: "eu-west-1" },
];

function Card({ title, caption, children, className }: { title: string; caption: string; children: ReactNode; className?: string }): React.JSX.Element {
  return (
    <section className={className}>
      <p className="mb-3 text-xs text-muted-foreground">{caption}</p>
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
        <h2 className="mb-4 text-sm font-medium tracking-[-0.01em]">{title}</h2>
        {children}
      </div>
    </section>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-2xl gap-10">
      <Card
        className="max-w-sm"
        title="Order ord_9F3K27XQ"
        caption="Stacked, for a narrow card: each label over its value. The long URL gives up its middle, the secret is dots until you reveal it, and a value that is a link is underlined, with an arrow when it leaves the site"
      >
        <KeyValueList items={ITEMS} />
      </Card>
      <Card title="Webhook delivery" caption="Two columns when there is room: the labels in a column of their own, and the copy buttons lined up at the end">
        <KeyValueList layout="columns" items={ITEMS} hideSecretsAfter={0} />
      </Card>
    </div>
  );
}
