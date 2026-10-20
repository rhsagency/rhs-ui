import { IntegrationHero } from "@rhs-ui/marketing/integration-hero";

/* Marks drawn for the demo. In your app these are the real logos, as inline SVG or <img>. */
const acme = (
  <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <path d="M20 5.5 35 33.5H5L20 5.5Z" fill="currentColor" />
    <path d="M13.5 27h13" className="stroke-card" strokeWidth="3.5" strokeLinecap="round" />
  </svg>
);

const northwind = (
  <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="3" />
    <path d="M20 9.5 25.5 22h-11L20 9.5Z" fill="currentColor" />
  </svg>
);

const kestrel = (
  <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <path d="M13 7.5v25M13 20 28 7.5M13 20l15 12.5" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <p className="pt-6 text-xs text-muted-foreground">Available</p>
      <IntegrationHero
        className="pt-8 sm:pt-8"
        product={{ name: "Acme", mark: acme }}
        partner={{ name: "Northwind", mark: northwind }}
        title="Acme for Northwind"
        description="Every paid invoice in Acme is posted to Northwind as a ledger entry, with its customer and tax code already matched."
        facts={[
          { term: "Setup time", value: "5 minutes" },
          { term: "What syncs", value: "Invoices and payments" },
          { term: "Plan needed", value: "Business or above" },
        ]}
        connectHref="#connect"
        guideHref="#guide"
        status="available"
      />
      <p className="border-t border-border pt-6 text-xs text-muted-foreground">Beta, another partner</p>
      <IntegrationHero
        className="pt-8 sm:pt-8"
        product={{ name: "Acme", mark: acme }}
        partner={{ name: "Kestrel", mark: kestrel }}
        title="Acme for Kestrel"
        description="A Kestrel task is created for every Acme ticket that has gone unanswered for two hours, assigned to whoever is on call."
        facts={[
          { term: "Setup time", value: "10 minutes" },
          { term: "What syncs", value: "Tickets and assignees" },
          { term: "Plan needed", value: "Any plan" },
        ]}
        connectHref="#connect"
        guideHref="#guide"
        status="beta"
        connectLabel="Join the beta"
      />
    </div>
  );
}
