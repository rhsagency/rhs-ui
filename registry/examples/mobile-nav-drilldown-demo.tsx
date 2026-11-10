import type { ReactNode } from "react";

import { DrilldownMenu, MobileNavDrilldown, type DrilldownGroup } from "@rhs-ui/marketing/mobile-nav-drilldown";
import { Button } from "@rhs-ui/primitives/button";

const GROUPS: readonly DrilldownGroup[] = [
  {
    label: "Products",
    href: "#products",
    links: [
      { label: "Planning", href: "#planning", description: "Roadmaps your team keeps up to date." },
      { label: "Reviews", href: "#reviews", description: "Feedback on the work, in context." },
      { label: "Reports", href: "#reports", description: "What shipped, what slipped, and why." },
      { label: "Automations", href: "#automations", description: "Hand the repeat work to rules." },
      { label: "Integrations", href: "#integrations", description: "The tools you already use." },
      { label: "Security", href: "#security", description: "SSO, audit logs and data residency." },
      { label: "Mobile apps", href: "#mobile", description: "iOS and Android, offline first." },
    ],
  },
  {
    label: "Solutions",
    href: "#solutions",
    links: [
      { label: "Agencies", href: "#agencies", description: "Run ten clients without ten tools." },
      { label: "Product teams", href: "#product-teams", description: "From discovery to release." },
      { label: "Consultancies", href: "#consultancies", description: "Scope, staff and bill in one place." },
      { label: "Nonprofits", href: "#nonprofits", description: "Free for teams under twenty." },
    ],
  },
  {
    label: "Resources",
    links: [
      { label: "Guides", href: "#guides", description: "From the first project to the fiftieth." },
      { label: "Changelog", href: "#changelog", description: "Everything new, every week." },
      { label: "Templates", href: "#templates", description: "Start from a plan that worked." },
      { label: "Help centre", href: "#help", description: "Answers, and a person if you need one." },
    ],
  },
  {
    label: "Company",
    links: [
      { label: "About", href: "#about", description: "Fourteen people in Utrecht and Lisbon." },
      { label: "Careers", href: "#careers", description: "Three open roles." },
      { label: "Press", href: "#press", description: "Logos, photos and facts." },
    ],
  },
  { label: "Pricing", href: "#pricing" },
  { label: "Customers", href: "#customers" },
];

const brand = (
  <a href="#top" className="rounded-sm text-base font-semibold tracking-tight outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
    Halcyon
  </a>
);

const actions = (
  <>
    <Button variant="outline" size="lg">
      Sign in
    </Button>
    <Button size="lg">Start free</Button>
  </>
);

function Phone({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <figure className="grid grid-cols-1 gap-4">
      <div className="mx-auto h-[42rem] w-full max-w-[21rem] rounded-[2.5rem] border border-border bg-muted p-2.5">
        <div className="h-full overflow-hidden rounded-[2rem] border border-border bg-background">{children}</div>
      </div>
      <figcaption className="mx-auto max-w-[21rem] text-center text-xs leading-relaxed text-muted-foreground">{caption}</figcaption>
    </figure>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-4 py-8 sm:px-6">
      <div className="grid gap-3">
        <p className="text-xs leading-relaxed text-muted-foreground">
          The menu button opens the real sheet. Open Products, then press Escape: it goes up a level, and only from the root does it close the sheet.
        </p>
        <header className="flex h-14 items-center justify-between rounded-xl border border-border bg-background pr-2 pl-5">
          {brand}
          <MobileNavDrilldown brand={brand} groups={GROUPS} current="#reviews" actions={actions} />
        </header>
      </div>

      <div className="grid grid-cols-1 gap-x-10 gap-y-12 md:grid-cols-2">
        <Phone caption="The root list. A group carries a chevron and opens its own panel; the rest go straight to the page.">
          <DrilldownMenu brand={brand} groups={GROUPS} current="#reviews" actions={actions} navLabel="Main, root list" />
        </Phone>
        <Phone caption="A group open: a Back row that names where it returns to, the group's own page, then its links.">
          <DrilldownMenu brand={brand} groups={GROUPS} current="#reviews" actions={actions} defaultGroup="Products" navLabel="Main, group open" />
        </Phone>
      </div>
    </div>
  );
}
