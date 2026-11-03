"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { IconBell, IconCreditCard, IconKey, IconPuzzle, IconShield, IconUser, IconUsers } from "@rhs-ui/icons";
import { SidebarLayout } from "@rhs-ui/primitives/sidebar-layout";
import { SidebarNav, type SidebarNavGroup } from "@rhs-ui/primitives/sidebar-nav";

const NAV: readonly SidebarNavGroup[] = [
  {
    label: "Account",
    links: [
      { href: "#profile", label: "Profile", icon: <IconUser /> },
      { href: "#billing", label: "Billing", icon: <IconCreditCard /> },
      { href: "#team", label: "Team", icon: <IconUsers />, badge: "12" },
      { href: "#security", label: "Security", icon: <IconShield /> },
    ],
  },
  {
    label: "Workspace",
    links: [
      { href: "#notifications", label: "Notifications", icon: <IconBell /> },
      { href: "#integrations", label: "Integrations", icon: <IconPuzzle /> },
      { href: "#keys", label: "API keys", icon: <IconKey /> },
    ],
  },
];

const INVOICES = [
  { id: "INV-2041", date: "1 Oct 2026", amount: "€1,788.00" },
  { id: "INV-1977", date: "1 Oct 2025", amount: "€1,548.00" },
  { id: "INV-1902", date: "1 Oct 2024", amount: "€1,188.00" },
];

function Heading({ id, title, children }: { id: string; title: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="mb-5">
      <h2 id={id} className="text-lg font-semibold tracking-[-0.02em]">
        {title}
      </h2>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function Billing(): React.JSX.Element {
  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
        <p className="text-xs text-muted-foreground">Current plan</p>
        <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-base font-semibold tracking-[-0.02em]">Scale</p>
          <p className="text-sm text-muted-foreground tabular-nums">€149 per month, billed yearly</p>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Renews on 1 October 2027. Up to 25 seats, unlimited projects.</p>
      </div>
      <ul className="divide-y divide-border rounded-xl border border-border bg-card shadow-xs">
        {INVOICES.map((invoice) => (
          <li key={invoice.id} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
            <div className="min-w-0">
              <p className="font-medium">{invoice.id}</p>
              <p className="text-xs text-muted-foreground">{invoice.date}</p>
            </div>
            <p className="tabular-nums">{invoice.amount}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Whether the sidebar has wrapped onto its own line: the two are no longer level. */
function useStacked(): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [stacked, setStacked] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const read = () => {
      const sidebar = node.querySelector<HTMLElement>("[data-slot=sidebar-layout-sidebar]");
      const content = node.querySelector<HTMLElement>("[data-slot=sidebar-layout-content]");
      if (sidebar && content) setStacked(Math.abs(sidebar.offsetTop - content.offsetTop) > 1);
    };
    read();
    const observer = new ResizeObserver(read);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, stacked];
}

const FILTERS = ["All products", "Backpacks", "Totes", "Wallets", "Travel kits"];

function Stage(): React.JSX.Element {
  const [width, setWidth] = useState("640");
  const [ref, stacked] = useStacked();
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <SegmentedControl
          label="Space available"
          value={width}
          onValueChange={setWidth}
          options={[
            { value: "360", label: "360px" },
            { value: "640", label: "640px" },
            { value: "880", label: "880px" },
            { value: "fluid", label: "Fluid" },
          ]}
        />
        <p role="status" className="text-xs text-muted-foreground">
          {stacked ? "Not enough room beside it: the sidebar sits above." : "Room for both: side by side."}
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-dashed border-border bg-muted/30 p-3 sm:p-4 relative">
        <div className="max-w-full" style={{ width: width === "fluid" ? undefined : `${width}px` }}>
          <SidebarLayout
            ref={ref}
            sidebarWidth="12rem"
            gap="1.25rem"
            sidebar={
              <nav aria-label="Filters" className="rounded-lg border border-border bg-card p-1.5 shadow-xs">
                <ul className="grid gap-0.5">
                  {FILTERS.map((filter, index) => (
                    <li key={filter}>
                      <a href="#filters" aria-current={index === 1 ? "page" : undefined} className="flex h-8 items-center rounded-md px-2.5 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=page]:bg-muted aria-[current=page]:font-medium aria-[current=page]:text-foreground">
                        {filter}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            }
          >
            <div className="grid gap-3 rounded-lg border border-border bg-card p-4 shadow-xs">
              <div>
                <h3 className="text-sm font-semibold tracking-[-0.01em]">Backpacks</h3>
                <p className="text-xs text-muted-foreground">14 products</p>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2">
                {["Kestrel 24L", "Halcyon roll-top", "Northwind daypack", "Kestrel 32L"].map((name) => (
                  <div key={name} className="rounded-md bg-muted px-3 py-5 text-center text-xs font-medium">
                    {name}
                  </div>
                ))}
              </div>
            </div>
          </SidebarLayout>
        </div>
      </div>
    </div>
  );
}

const ARTICLE = [
  ["Why the sidebar wraps", "The sidebar keeps the width it prefers, and the content takes the rest. When the content would drop below its share of the row, there is no room for both, so the sidebar moves onto its own line."],
  ["Reading order", "The sidebar comes last in the markup because it is last on the wide layout. A keyboard moves through the page in the order people read it, and once the sidebar wraps it sits below the content."],
  ["Pinning it", "A sticky sidebar stays under your header while the article scrolls past. It only pins while the two are side by side, and it scrolls inside itself when it is taller than the screen."],
  ["Inside a dialog", "Nothing here reads the viewport. The same layout works in a dialog, a sheet or a narrow card: it looks at the space it was given."],
  ["Choosing the share", "A share of 60% keeps the content comfortable. Raise it for a text-heavy page and the sidebar wraps sooner; lower it and the two stay side by side in tighter spaces."],
  ["Spacing", "One gap serves both directions: it separates the columns beside each other and the lines once they wrap, so the rhythm never changes with the width."],
];

function Sticky(): React.JSX.Element {
  const box = useRef<HTMLDivElement>(null);
  // Start part-way down when the two sit side by side, so the pinned sidebar is seen pinned.
  useEffect(() => {
    if (box.current && box.current.clientWidth >= 640) box.current.scrollTop = 150;
  }, []);
  return (
    <div ref={box} tabIndex={0} aria-label="Scrolling article" className="relative h-[26rem] overflow-y-auto rounded-xl border border-border bg-card p-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 sm:p-6">
      <SidebarLayout
        side="end"
        sticky="0.5rem"
        sidebarWidth="13rem"
        gap="2rem"
        sidebar={
          <nav aria-label="On this page" className="grid gap-1 text-sm">
            <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">On this page</p>
            {ARTICLE.map(([title], index) => (
              <a key={title} href="#sticky" aria-current={index === 1 ? "location" : undefined} className="rounded-md px-2 py-1.5 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=location]:bg-muted aria-[current=location]:font-medium aria-[current=location]:text-foreground">
                {title}
              </a>
            ))}
          </nav>
        }
      >
        <article className="grid gap-6">
          {ARTICLE.map(([title, body]) => (
            <section key={title}>
              <h3 className="text-base font-semibold tracking-[-0.02em]">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </section>
          ))}
        </article>
      </SidebarLayout>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-16 px-4 py-12 sm:px-6">
      <section aria-labelledby="layout-settings">
        <Heading id="layout-settings" title="A settings page">
          An 18rem sidebar and the content beside it. Make the window narrow and the sidebar moves above the content by itself.
        </Heading>
        <SidebarLayout sidebar={<SidebarNav groups={NAV} currentHref="#billing" label="Settings" className="rounded-xl bg-muted/50 p-2" />}>
          <div>
            <h3 className="text-base font-semibold tracking-[-0.02em]">Billing</h3>
            <p className="mt-1 mb-5 max-w-prose text-sm text-muted-foreground">Your plan, your invoices and how Northwind is paid for.</p>
            <Billing />
          </div>
        </SidebarLayout>
      </section>

      <section aria-labelledby="layout-space">
        <Heading id="layout-space" title="It answers to the space, not the window">
          The same layout in a box of the width you pick. A 12rem sidebar leaves the content 60% of the row at least, so it wraps below about 530px.
        </Heading>
        <Stage />
      </section>

      <section aria-labelledby="layout-sticky">
        <Heading id="layout-sticky" title="At the end, and pinned">
          The sidebar comes last in the markup and stays in view while the article scrolls.
        </Heading>
        <Sticky />
      </section>
    </div>
  );
}
