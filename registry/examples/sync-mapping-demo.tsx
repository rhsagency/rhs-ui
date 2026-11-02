import type { ReactNode } from "react";

import { SyncMapping } from "@rhs-ui/marketing/sync-mapping";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="mb-8 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** Two small marks drawn for the demo, one for each tool. A real one would be the tool's own logo. */
const HalcyonMark = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <circle cx="8" cy="8" r="5.5" />
    <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

const LedgerlyMark = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3.5" y="2.5" width="9" height="11" rx="1.5" />
    <path d="M6 6h4M6 9h4" />
  </svg>
);

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Example caption="Five pairs of objects between a CRM and an accounting tool: the direction is drawn and written, the frequency is stated, and what does not sync is listed under the table">
        <SyncMapping
          eyebrow="Integration"
          title="What syncs between Halcyon and Ledgerly"
          description="Connect once, then see exactly what moves, which way and how often. Nothing syncs that is not on this list."
          left={{ name: "Halcyon", mark: HalcyonMark }}
          right={{ name: "Ledgerly", mark: LedgerlyMark }}
          rows={[
            { ours: "Contacts", theirs: "Customers", direction: "both", frequency: "Real time", note: "Matched on email address. A contact without one is skipped." },
            { ours: "Deals", theirs: "Invoices", direction: "to-right", frequency: "Real time", note: "A draft invoice appears when a deal is won. You send it from Ledgerly." },
            { ours: "Payments", theirs: "Payments", direction: "to-left", frequency: "Every 15 minutes", note: "Payments recorded in Ledgerly show on the deal. They are read-only in Halcyon." },
            { ours: "Products", theirs: "Items", direction: "both", frequency: "Every hour", note: "Name and price only. Stock levels stay in Ledgerly." },
            { ours: "Tax rates", theirs: "Tax codes", direction: "to-left", frequency: "Once a day", note: "A read-only list, used when a quote is turned into an invoice." },
          ]}
          limits={[
            "Attachments and files are not synced.",
            "Custom fields sync only when the field has the same name in both tools.",
            "Deleting a record in one tool archives it in the other. Nothing is removed for 30 days.",
            "Data from before you connected is imported once and is not kept in sync.",
          ]}
        />
      </Example>

      <div className="mx-auto mt-20 max-w-md border-t border-border pt-12 sm:mt-24">
        <Example caption="A shorter mapping in a narrow column, without marks: the table scrolls sideways in a region of its own, and says so">
          <SyncMapping
            headingLevel={3}
            title="Northwind and Kestrel Books"
            left={{ name: "Northwind" }}
            right={{ name: "Kestrel Books" }}
            rows={[
              { ours: "Orders", theirs: "Sales receipts", direction: "to-right", frequency: "Real time", note: "Paid orders only." },
              { ours: "Customers", theirs: "Customers", direction: "both", frequency: "Every 15 minutes" },
              { ours: "Refunds", theirs: "Credit notes", direction: "to-right", frequency: "Once a day", note: "Partial refunds are summed per order." },
            ]}
            limits={["Gift cards are not synced.", "Shipping labels stay in Northwind."]}
          />
        </Example>
      </div>
    </div>
  );
}
