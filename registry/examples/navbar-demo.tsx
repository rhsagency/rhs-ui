"use client";

import { Navbar, type NavbarEntry } from "@rhs-ui/marketing/navbar";
import { Button } from "@rhs-ui/primitives/button";

const ITEMS: readonly NavbarEntry[] = [
  {
    label: "Product",
    links: [
      { label: "Planning", href: "#planning", description: "Roadmaps your team keeps up to date." },
      { label: "Reviews", href: "#reviews", description: "Feedback on the work, in context." },
      { label: "Reports", href: "#reports", description: "What shipped, what slipped, and why." },
      { label: "Integrations", href: "#integrations", description: "The tools you already use." },
    ],
  },
  {
    label: "Resources",
    links: [
      { label: "Guides", href: "#guides", description: "From the first project to the fiftieth." },
      { label: "Changelog", href: "#changelog", description: "Everything new, every week." },
    ],
  },
  { label: "Pricing", href: "#pricing" },
  { label: "Customers", href: "#customers" },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="-m-6 min-h-[48rem]">
      <Navbar
        brand={
          <a href="#top" className="text-base font-semibold tracking-tight">
            Fieldwork
          </a>
        }
        items={ITEMS}
        currentHref="#pricing"
        actions={
          <>
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
            <Button size="sm">Start free</Button>
          </>
        }
      />
      <section id="top" className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="text-xs font-medium tracking-[.18em] text-muted-foreground uppercase">Planning for studios</p>
        <h2 className="mt-5 text-5xl font-medium tracking-[-.05em] text-balance">Plans that stay true while the work moves.</h2>
        <p className="mx-auto mt-6 max-w-md text-muted-foreground">Hover Product, or tab to it and press Enter. On a phone the same groups open in a sheet.</p>
      </section>
    </div>
  );
}
