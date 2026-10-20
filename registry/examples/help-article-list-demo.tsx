import { HelpArticleList } from "@rhs-ui/marketing/help-article-list";
import { Button } from "@rhs-ui/primitives/button";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <HelpArticleList
        title="Billing and payments"
        description="Plans, invoices, payment methods and refunds: how Northwind charges you, and what to do when something looks off."
        count={13}
        updated="2026-10-14"
        locale="en-GB"
        sections={[
          {
            title: "Plans and pricing",
            articles: [
              { title: "Compare Starter, Business and Enterprise", href: "#compare-plans", summary: "What each plan includes, and the limits that matter before you upgrade." },
              { title: "Change your plan", href: "#change-plan", summary: "Upgrade at once or downgrade at the end of the billing period." },
              { title: "How seats are counted", href: "#seats", summary: "Who counts as a seat, and why guests and viewers are free." },
            ],
          },
          {
            title: "Invoices",
            articles: [
              { title: "Find and download an invoice", href: "#find-invoice", summary: "Every invoice since you joined, as a PDF with your company details." },
              { title: "Add a VAT number or purchase order", href: "#vat-number", summary: "Put the right details on the next invoice before it is issued." },
              { title: "Why did my invoice total change?", href: "#total-changed", summary: "Taxes, proration and discounts, explained with a worked example." },
            ],
          },
          {
            title: "Payment methods",
            articles: [
              { title: "Pay by card, SEPA debit or bank transfer", href: "#pay-methods", summary: "Which methods are available in your country, and how long each takes." },
              { title: "Update an expired card", href: "#expired-card", summary: "Replace a card in two minutes and retry the failed payment." },
              { title: "A payment failed: what happens next", href: "#failed-payment", summary: "How many days you have before the workspace is paused." },
            ],
          },
          {
            title: "Refunds and credits",
            articles: [
              { title: "Request a refund", href: "#refund", summary: "Our 30-day policy, and what we need from you to process it." },
              { title: "How account credit works", href: "#credit", summary: "Where credit comes from, and when it is applied to an invoice." },
            ],
          },
          {
            title: "Taxes",
            articles: [
              { title: "VAT and sales tax by country", href: "#vat-by-country", summary: "When we charge tax, and how reverse charge works for EU businesses." },
              { title: "Download a tax statement", href: "#tax-statement", summary: "A yearly summary for your accountant, ready in January." },
            ],
          },
        ]}
        contact={
          <div className="flex flex-col gap-4 @3xl:flex-row @3xl:items-center @3xl:justify-between @3xl:gap-6">
            <p className="text-pretty">Our support team answers within one business day, and a person reads every message.</p>
            <Button variant="outline" className="shrink-0 self-start @3xl:self-auto">
              Contact support
            </Button>
          </div>
        }
      />
    </div>
  );
}
