import type { ReactNode } from "react";

import { RelatedLinks, type RelatedLink } from "@rhs-ui/primitives/related-links";

const WEBHOOKS: readonly RelatedLink[] = [
  { title: "Retry failed webhooks with backoff", href: "#guides-retries", kind: "Guide", summary: "Pick a retry schedule, cap the attempts and send the rest to a dead-letter queue.", minutes: 6 },
  { title: "Webhook endpoints", href: "#api-endpoints", kind: "API", summary: "Create, update and rotate the signing secret of an endpoint.", minutes: 4 },
  { title: "Debugging a missed delivery", href: "#video-deliveries", kind: "Video", summary: "A walkthrough of the delivery log and the replay button.", minutes: 9 },
  { title: "Verify signatures in Node and Go", href: "#guides-signatures", kind: "Guide", summary: "Reject forged requests before they reach your handler.", minutes: 5 },
];

const BILLING: readonly RelatedLink[] = [
  { title: "Plans and seats", href: "#billing-plans", kind: "Guide", minutes: 3 },
  { title: "Change your billing contact", href: "#billing-contact", kind: "Guide", minutes: 2 },
  { title: "Invoices API", href: "#billing-invoices", kind: "API", minutes: 5 },
  { title: "Usage-based pricing explained", href: "#billing-usage", kind: "Video", minutes: 8 },
  { title: "Tax IDs and VAT", href: "#billing-tax", kind: "Guide", minutes: 4 },
  { title: "Refunds and credits", href: "#billing-refunds", kind: "Guide", minutes: 3 },
];

const SHORT: readonly RelatedLink[] = [
  { title: "Rate limits", href: "#rate-limits" },
  { title: "Pagination", href: "#pagination" },
  { title: "Idempotency keys", href: "#idempotency" },
];

function Example({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <section className="grid min-w-0 grid-cols-1 content-start gap-4">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </section>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl gap-x-12 gap-y-10 [grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr))]">
      <div className="min-w-0 [grid-column:1/-1]">
        <Example caption="The end of an article: each row names its kind, says why it is worth opening and how long it takes. The whole row is the link.">
          <RelatedLinks heading="Keep reading" links={WEBHOOKS} />
        </Example>
      </div>

      <div className="min-w-0 [grid-column:1/-1]">
        <Example caption="Two columns from the sm breakpoint up, at a lower heading level for a docs sidebar page.">
          <RelatedLinks heading="More about billing" headingLevel={3} layout="columns" links={BILLING} />
        </Example>
      </div>

      <Example caption="Only titles: every other part is optional.">
        <RelatedLinks heading="Also in the API" headingLevel={3} links={SHORT} />
      </Example>

      <Example caption="An empty list renders nothing at all: no heading, no landmark. The box below holds one.">
        <div className="grid min-h-24 w-full place-items-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
          <RelatedLinks links={[]} />
          <span aria-hidden="true">Nothing rendered</span>
        </div>
      </Example>
    </div>
  );
}
