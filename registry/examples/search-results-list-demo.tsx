import { SearchResultsList } from "@rhs-ui/marketing/search-results-list";

const pageHref = (page: number) => `#page-${page}`;

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <p className="mb-6 text-xs text-muted-foreground">A page of results, the second of five</p>
      <SearchResultsList
        query="invoice"
        total={24}
        locale="en-GB"
        filters={[
          { label: "All", href: "#all", count: 24, current: true },
          { label: "Pages", href: "#pages", count: 3 },
          { label: "Articles", href: "#articles", count: 7 },
          { label: "Docs", href: "#docs", count: 14 },
        ]}
        results={[
          {
            title: "Create and send an invoice",
            href: "#create-invoice",
            path: ["Docs", "Billing", "Invoices"],
            snippet: "Open the invoice editor, add line items and choose a payment term. When you send the invoice, your customer gets a link to pay by card or bank transfer.",
            type: "Doc",
            date: "2026-09-14",
          },
          {
            title: "Invoice statuses explained",
            href: "#invoice-statuses",
            path: ["Docs", "Billing", "Invoices"],
            snippet: "Every invoice moves through draft, sent, viewed, paid or overdue. This page explains what each status means and which actions it unlocks.",
            type: "Doc",
            date: "2026-08-02",
          },
          {
            title: "Why did my invoice total change?",
            href: "#total-changed",
            path: ["Articles", "Billing"],
            snippet: "Taxes and discounts are recalculated whenever an invoice is edited. If a total looks different from the quote, check the invoice for a changed VAT rate.",
            type: "Article",
            date: "2026-07-21",
          },
          {
            title: "Plans and pricing",
            href: "#pricing",
            path: ["Product", "Pricing"],
            snippet: "Every plan includes unlimited invoices, automatic reminders and exports. Business adds approval flows and custom invoice templates.",
            type: "Page",
          },
          {
            title: "Custom invoice templates",
            href: "#templates",
            path: ["Docs", "Billing", "Customisation"],
            snippet: "Add your logo, change the footer and pick which fields appear on the invoice. Templates apply to every new invoice and can be previewed before you save.",
            type: "Doc",
            date: "2026-06-30",
          },
        ]}
        page={2}
        pageCount={5}
        pageHref={pageHref}
      />

      <p className="mt-16 mb-6 border-t border-border pt-8 text-xs text-muted-foreground">The first page of a shorter search, two results to a page: Previous is disabled</p>
      <SearchResultsList
        query="payout"
        total={10}
        locale="en-GB"
        labels={{ pagination: "Payout results pages" }}
        results={[
          {
            title: "Payout schedule and cut-off times",
            href: "#payout-schedule",
            path: ["Docs", "Payments", "Payouts"],
            snippet: "Payouts are sent every business day. A payout requested before 15:00 leaves the same day, and a later one leaves on the next business day.",
            type: "Doc",
            date: "2026-10-02",
          },
          {
            title: "Why is my payout late?",
            href: "#payout-late",
            path: ["Articles", "Payments"],
            snippet: "A payout can be held while we check a new bank account. Most checks take one business day, and we email you as soon as it is released.",
            type: "Article",
            date: "2026-09-18",
          },
        ]}
        page={1}
        pageCount={5}
        pageHref={pageHref}
      />

      <p className="mt-16 mb-6 border-t border-border pt-8 text-xs text-muted-foreground">Nothing found with the Docs filter on</p>
      <SearchResultsList
        query="refund policy"
        total={0}
        filtersLabel="Filter refund policy results by type"
        filters={[
          { label: "All", href: "#all", count: 5 },
          { label: "Pages", href: "#pages", count: 2 },
          { label: "Articles", href: "#articles", count: 3 },
          { label: "Docs", href: "#docs", count: 0, current: true },
        ]}
        results={[]}
        suggestions={[
          { label: "refunds", href: "#refunds" },
          { label: "return policy", href: "#returns" },
        ]}
        emptyAction={
          <p className="text-muted-foreground">
            Still stuck? <a href="#support" className="font-medium text-foreground underline underline-offset-4">Ask our support team</a>
          </p>
        }
      />
    </div>
  );
}
