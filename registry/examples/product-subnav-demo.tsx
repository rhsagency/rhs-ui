"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { ProductSubnav } from "@rhs-ui/marketing/product-subnav";
import { Button } from "@rhs-ui/primitives/button";

export default function Demo(): React.JSX.Element {
  const pages = [
    { label: "Overview", href: "#overview" },
    { label: "Specs", href: "#specs" },
    { label: "Pricing", href: "#pricing" },
    { label: "Support", href: "#support" },
  ];
  const tagline = "Scheduling for studios that would rather be teaching.";
  const action = <Button size="sm">Try free</Button>;

  return (
    <div className="mx-auto grid max-w-5xl gap-12 px-6 py-6">
      <figure className="grid gap-3">
        <Caption>
          Pages mode, at the top: the name set large with its tagline, and the links beneath. Each link is another page of the product; the current one carries aria-current=&quot;page&quot; and a line on the bar&apos;s hairline.
        </Caption>
        <Frame label="Product page at the top">
          <ProductSubnav name="Halcyon Pro" tagline={tagline} links={pages} currentHref="#specs" offset={56} action={action} />
          <Sections prefix="rest" />
        </Frame>
      </figure>

      <figure className="grid gap-3">
        <Caption>The same page after scrolling: the big name has gone, and the bar is stuck under the main navbar with the name at its left, the links in the middle and the action at its right.</Caption>
        <Frame label="Product page scrolled" scrollTo="stuck-overview">
          <ProductSubnav name="Halcyon Pro" tagline={tagline} links={pages} currentHref="#specs" offset={56} action={action} navLabel="Halcyon Pro, scrolled" />
          <Sections prefix="stuck" />
        </Frame>
      </figure>

      <figure className="grid gap-3">
        <Caption>
          Anchors mode on a long page: the links jump to sections and follow the scroll, marked with aria-current=&quot;location&quot;. Scroll the frame, or choose a link: it clears the navbar and the bar, and focus lands on the heading.
        </Caption>
        <Frame label="Product page with anchors" scrollTo="anchors-specs">
          <ProductSubnav
            mode="anchors"
            name="Halcyon Pro"
            tagline={tagline}
            links={[
              { label: "Overview", href: "#anchors-overview" },
              { label: "Specs", href: "#anchors-specs" },
              { label: "Pricing", href: "#anchors-pricing" },
              { label: "Support", href: "#anchors-support" },
            ]}
            offset={56}
            action={action}
            navLabel="Halcyon Pro, on this page"
          />
          <Sections prefix="anchors" />
        </Frame>
      </figure>
    </div>
  );
}

/** The main navbar of a site, as tall as the offset the subnav is told about: the bar sticks just under it. */
function MainBar(): React.JSX.Element {
  return (
    <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
      <span className="font-semibold tracking-[-0.03em]">Halcyon</span>
      <span aria-hidden="true" className="flex gap-5 text-sm text-muted-foreground">
        <span className="hidden sm:inline">Products</span>
        <span className="hidden sm:inline">Customers</span>
        <span>Sign in</span>
      </span>
    </div>
  );
}

/** A page in a frame that scrolls on its own, so the bar can be seen at rest and stuck in one preview. In your page the window scrolls and the bar is sticky to it. */
function Frame({ label, scrollTo, children }: { label: string; scrollTo?: number | string; children: ReactNode }): React.JSX.Element {
  const frame = useRef<HTMLElement>(null);
  useEffect(() => {
    const node = frame.current;
    if (!node || scrollTo === undefined) return;
    const target = typeof scrollTo === "string" ? node.querySelector<HTMLElement>(`#${scrollTo}`) : null;
    // The section lands just under the navbar and the bar (56px each).
    node.scrollTo({ top: typeof scrollTo === "number" ? scrollTo : target ? target.offsetTop - 112 : 0 });
  }, [scrollTo]);
  return (
    <section ref={frame} aria-label={label} className="relative h-[32rem] overflow-y-auto overscroll-contain rounded-xl border border-border bg-background">
      <MainBar />
      {children}
    </section>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }): React.JSX.Element {
  return (
    <section id={id} className="mx-auto min-h-[16rem] max-w-3xl scroll-mt-36 border-b border-border px-4 py-12 last:border-b-0 sm:px-6">
      <h2 className="text-2xl font-medium tracking-[-0.035em]">{title}</h2>
      <div className="mt-4 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function Sections({ prefix }: { prefix: string }): React.JSX.Element {
  return (
    <>
      <Section id={`${prefix}-overview`} title="Overview">
        <p className="max-w-lg">Classes, rooms and teachers in one calm calendar. Reminders go out by text and email, and one tap moves a booking to another day.</p>
        <ul className="mt-5 grid gap-2 text-foreground sm:grid-cols-3">
          {["Fewer no-shows", "One calendar for every room", "Payments that settle themselves"].map((item) => (
            <li key={item} className="rounded-lg border border-border bg-card px-3.5 py-3 text-sm font-medium">
              {item}
            </li>
          ))}
        </ul>
      </Section>
      <Section id={`${prefix}-specs`} title="Specifications">
        <dl className="grid max-w-md gap-3 text-sm">
          {[
            ["Members", "Up to 5,000"],
            ["Rooms", "Unlimited"],
            ["Uptime last year", "99.98%"],
            ["Data location", "Frankfurt, EU"],
          ].map(([term, value]) => (
            <div key={term} className="flex items-baseline justify-between gap-6 border-b border-border pb-3 last:border-b-0">
              <dt>{term}</dt>
              <dd className="font-medium text-foreground tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </Section>
      <Section id={`${prefix}-pricing`} title="Pricing">
        <p className="max-w-lg">Halcyon Pro is €49 a month for the whole studio, billed yearly. Every teacher and every room is included, and the first fourteen days are free.</p>
      </Section>
      <Section id={`${prefix}-support`} title="Support">
        <p className="max-w-lg">Answers within a working day, from the people who built it. Phone support is open Monday to Friday, 8:00 to 18:00 Amsterdam time.</p>
      </Section>
    </>
  );
}

function Caption({ children }: { children: ReactNode }): React.JSX.Element {
  return <figcaption className="text-xs leading-relaxed text-muted-foreground">{children}</figcaption>;
}
