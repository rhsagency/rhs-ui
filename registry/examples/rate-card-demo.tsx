import { RateCard, type RateGroup } from "@rhs-ui/marketing/rate-card";

const platform: RateGroup[] = [
  {
    title: "Platform",
    rows: [
      { resource: "API requests", included: 1000000, rate: 0.4, unit: "1,000 requests", note: "Burst limit of 200 requests a second" },
      { resource: "Webhook deliveries", included: 100000, rate: 0.2, unit: "1,000 deliveries", note: "Failed deliveries are retried for 24 hours at no charge" },
      { resource: "Storage", included: "10 GB", rate: 0.15, unit: "GB", note: "Measured as the average over the month" },
      { resource: "Bandwidth", included: "100 GB", rate: 0.08, unit: "GB", note: "Inbound traffic is always free" },
    ],
  },
  {
    title: "Team",
    rows: [
      { resource: "Seats", included: 5, rate: 12, unit: "seat", note: "Only seats that signed in during the month are billed" },
      { resource: "Read-only viewers", included: "Unlimited", rate: 0 },
      { resource: "Audit log retention", included: "30 days", rate: 0.5, unit: "GB per month" },
    ],
  },
  {
    title: "Add-ons",
    rows: [
      { resource: "Image renders", included: 200, rate: 0.04, unit: "render" },
      { resource: "Custom domains", included: "Unlimited", rate: null },
      { resource: "Priority support", included: null, rate: 499, unit: "month", note: "Four-hour response, every day of the week" },
      { resource: "Single sign-on", included: null, rate: "Custom", note: "Talk to us about SAML and SCIM" },
    ],
  },
];

const hosting: RateGroup[] = [
  {
    title: "Kestrel Pages",
    rows: [
      { resource: "Build minutes", included: 6000, rate: 0.008, unit: "minute" },
      { resource: "Bandwidth", included: "1 TB", rate: 0.05, unit: "GB", note: "Measured at the edge" },
      { resource: "Preview deployments", included: "Unlimited", rate: 0 },
    ],
  },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <p className="mb-8 text-xs text-muted-foreground">
        Metered pricing for an API product: three groups, units spelled out, a caption that says how it is billed and when the prices were checked. Under 672px each row stacks and keeps its labels.
      </p>
      <RateCard
        title="Pay for what you use"
        description="Every plan includes the allowances below. After that you pay per unit, with no tiers to climb and no minimum."
        groups={platform}
        billing="Billed monthly, in arrears"
        checkedOn="2026-10-12"
        footnote="Prices are in US dollars and exclude VAT. Usage is metered per project and totalled across your workspace on the first day of the next month."
      />

      <div className="mt-20 max-w-xl border-t border-border pt-12">
        <p className="mb-8 text-xs text-muted-foreground">In a narrow column, in euros: the same table as stacked blocks, with a rate of a fraction of a cent kept to four digits</p>
        <RateCard headingLevel={3} title="Hosting" groups={hosting} currency="EUR" locale="en-IE" billing="Billed monthly, in advance" checkedOn="2026-10-12" footnote="Prices exclude VAT." />
      </div>
    </div>
  );
}
