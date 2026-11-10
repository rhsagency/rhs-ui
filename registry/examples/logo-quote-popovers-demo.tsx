import { LogoQuotePopovers } from "@rhs-ui/marketing/logo-quote-popovers";

/** A wordmark drawn in SVG text, as wide as its letters (`width` is that, at 20px), so it sits in the middle of its cell and scales down evenly when the cell is narrow. In your page: the customer's logo, with their permission, which carries its own viewBox. */
function Wordmark({ name, width, weight = 600 }: { name: string; width: number; weight?: number }): React.JSX.Element {
  return (
    <svg viewBox={`0 0 ${width} 28`} width={width} height={28} aria-hidden="true">
      <text x="0" y="21" fontSize="20" fontWeight={weight} fill="currentColor" letterSpacing="-0.5" textLength={width} lengthAdjust="spacingAndGlyphs">
        {name}
      </text>
    </svg>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-6">
      {/* The second customer starts open, so the preview shows what a panel looks like; nothing takes focus for it. */}
      <LogoQuotePopovers
        title="Customers, in their own words"
        description="Select a logo to read what they said."
        defaultOpenId="halcyon"
        customers={[
          {
            id: "northwind",
            name: "Northwind",
            mark: <Wordmark name="Northwind" width={94} />,
            quote: "We moved forty warehouses in a weekend and nobody on the floor noticed the change.",
            person: "Anika Visser",
            role: "Head of operations",
            result: "40 sites migrated in 48 hours",
            href: "#northwind",
          },
          {
            id: "halcyon",
            name: "Halcyon",
            mark: <Wordmark name="Halcyon" width={70} weight={500} />,
            quote: "Support tickets fell by a third in the first quarter, and the team got their afternoons back.",
            person: "Tomás Herrera",
            role: "VP Customer Success",
            result: "33 percent fewer tickets",
            href: "#halcyon",
          },
          {
            id: "kestrel",
            name: "Kestrel",
            mark: <Wordmark name="Kestrel" width={62} weight={700} />,
            quote: "The audit trail alone paid for the licence. Our auditors stopped asking us questions.",
            person: "Mei Tanaka",
            role: "Chief Risk Officer",
            result: "Audit prep: six weeks down to four days",
            href: "#kestrel",
          },
          {
            id: "polder",
            name: "Polder",
            mark: <Wordmark name="Polder" width={56} />,
            quote: "Onboarding a new clinic used to take a month. Now it takes a morning, and a coffee.",
            person: "Jonas Keller",
            role: "Director of engineering",
            result: "Clinic onboarding in one day",
            href: "#polder",
          },
          {
            id: "lumen",
            name: "Lumen",
            mark: <Wordmark name="Lumen" width={59} weight={500} />,
            quote: "It is the first tool our installers open without being reminded. That says enough.",
            person: "Sara Haddad",
            role: "Founder",
          },
          {
            id: "fjord",
            name: "Fjord",
            mark: <Wordmark name="Fjord" width={47} weight={700} />,
            quote: "Every quote now leaves the building the same day. Before, it was the same week, if we were lucky.",
            person: "Ole Hansen",
            role: "Sales director",
            result: "Quotes sent same day",
          },
          {
            id: "atlas",
            name: "Atlas",
            mark: <Wordmark name="Atlas" width={43} />,
            quote: "Rate limits are documented, errors are readable and the changelog tells you what will break before it does.",
            person: "Elif Aksoy",
            role: "Staff engineer",
            href: "#atlas",
          },
          {
            id: "oakline",
            name: "Oakline",
            mark: <Wordmark name="Oakline" width={68} weight={700} />,
            quote: "We cancelled three tools in the first month. The invoice in month twelve matched month one.",
            person: "Priya Raman",
            role: "Co-founder",
            result: "Three tools retired",
          },
        ]}
      />
    </div>
  );
}
