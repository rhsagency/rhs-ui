"use client";

import { useState, type ReactNode } from "react";

import { HeadingAnchorLink } from "@rhs-ui/primitives/heading-anchor-link";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const jumpLink = "rounded-sm underline-offset-4 outline-none transition-colors hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

export default function Demo(): React.JSX.Element {
  const [copied, setCopied] = useState("");
  return (
    <div className="grid w-full max-w-2xl gap-9">
      <Example caption="The first heading keeps its link in view. Hover or Tab to the others: pressing a link jumps there, puts the fragment in the address bar and copies the full URL.">
        <article className="w-full rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xs sm:p-8">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Halcyon docs · Getting started</p>
          <HeadingAnchorLink id="anchor-demo-installation" reveal="always" onCopy={setCopied}>
            Installation
          </HeadingAnchorLink>
          <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
            Halcyon ships as a single package with no peer dependencies. Install it with your package manager, then import the client where your app starts.
          </p>

          <HeadingAnchorLink as="h3" id="anchor-demo-requirements" className="mt-7" onCopy={setCopied}>
            Requirements
          </HeadingAnchorLink>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Node 20 or newer, and an API key from the Halcyon dashboard. Keys are scoped to one workspace.</p>

          <HeadingAnchorLink as="h3" id="anchor-demo-configuration" className="mt-7" onCopy={setCopied}>
            Configuration
          </HeadingAnchorLink>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Set the key as an environment variable. Retries, timeouts and the region are optional and have sensible defaults.</p>
        </article>
        <p className="w-full truncate text-xs text-muted-foreground" aria-live="polite">
          {copied ? (
            <>
              On the clipboard: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.6875rem] text-foreground">{copied}</code>
            </>
          ) : (
            "Nothing copied yet."
          )}
        </p>
      </Example>

      <Example caption="Under a sticky header, offset keeps a heading clear of it after a jump. Press a link in the header, or a # on a heading.">
        <div className="w-full overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-xs">
          <div className="relative h-80 overflow-y-auto overscroll-contain outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40" role="region" tabIndex={0} aria-label="Pricing documentation">
            <div className="sticky top-0 z-10 flex h-12 items-center justify-between gap-4 border-b border-border bg-card px-5 sm:px-8">
              {/* On the narrowest phones the word "docs" gives way, so the title stays on one line next to all three links. */}
              <span className="shrink-0 text-sm font-semibold tracking-[-0.01em] whitespace-nowrap">
                Halcyon <span className="max-[22rem]:hidden">docs</span>
              </span>
              <nav aria-label="Jump to a section" className="flex items-center gap-3 text-xs text-muted-foreground sm:gap-4">
                <a href="#anchor-demo-seats" className={jumpLink}>
                  Seats
                </a>
                <a href="#anchor-demo-proration" className={jumpLink}>
                  Proration
                </a>
                <a href="#anchor-demo-vat" className={jumpLink}>
                  VAT
                </a>
              </nav>
            </div>

            {/* Room under the last section, so even that heading can be brought up to the header. */}
            <div className="px-5 pt-6 pb-40 sm:px-8">
              <HeadingAnchorLink id="anchor-demo-pricing" reveal="always" offset={64}>
                Pricing and billing
              </HeadingAnchorLink>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                Every workspace starts on the Team plan at €12 per seat each month. Paying annually takes two months off the price, and the plan can be changed at any time from the billing screen.
              </p>

              <HeadingAnchorLink as="h3" id="anchor-demo-seats" reveal="always" offset={64} className="mt-9">
                How seats are counted
              </HeadingAnchorLink>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                A seat is a person who signed in during the billing period. Guests who can only view shared dashboards are free and never count toward the total.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Deactivated members stop counting from the day they are deactivated, so offboarding someone never costs a full month.</p>

              <HeadingAnchorLink as="h3" id="anchor-demo-proration" reveal="always" offset={64} className="mt-9">
                Proration when you add a seat
              </HeadingAnchorLink>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Adding a seat on the 12th charges the rest of the month, rounded to the day, on your next invoice. Removing one credits the same amount in the same way.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Credits are applied before the card is charged, so a downgrade at the end of the cycle often produces an empty invoice.</p>

              <HeadingAnchorLink as="h3" id="anchor-demo-vat" reveal="always" offset={64} className="mt-9">
                Invoices and VAT
              </HeadingAnchorLink>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Add a VAT number under billing details and it appears on every invoice from then on. Earlier invoices can be reissued once, free of charge, within the same quarter.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Invoices are emailed to the billing contact and stay available as PDF downloads for seven years.</p>
            </div>
          </div>
        </div>
      </Example>
    </div>
  );
}
