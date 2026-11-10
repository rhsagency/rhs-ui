import type { ReactNode } from "react";

import { TextLink } from "@rhs-ui/primitives/text-link";

function Row({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-baseline gap-x-4 py-3.5 sm:grid-cols-[7.5rem_minmax(0,1fr)]">
      <dt className="text-xs text-muted-foreground">{caption}</dt>
      <dd className="m-0 text-[0.9375rem] leading-6">{children}</dd>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-xl">
        <p className="text-[0.9375rem] leading-7 text-pretty text-muted-foreground">
          Northwind Cloud moves to usage-based billing on <TextLink href="#pricing">1 March</TextLink>. Read the{" "}
          <TextLink href="https://docs.northwind.dev/billing/migration" external>
            migration guide
          </TextLink>
          , keep the <TextLink href="/files/northwind-annual-report-2025.pdf" download={{ type: "PDF", size: 2_411_000 }}>2025 annual report</TextLink> for your records, or ask{" "}
          <TextLink href="#sales" disabled>
            sales
          </TextLink>{" "}
          once the desk reopens on Monday.
        </p>

        <dl className="mt-8 divide-y divide-border border-y border-border">
          <Row caption="Underlined">
            <TextLink href="#billing">Billing settings</TextLink>
          </Row>
          <Row caption="Subtle">
            <span className="inline-flex flex-wrap gap-x-5 gap-y-1">
              <TextLink tone="subtle" href="#terms">
                Terms
              </TextLink>
              <TextLink tone="subtle" href="#privacy">
                Privacy policy
              </TextLink>
              <TextLink tone="subtle" href="#cookies">
                Cookie settings
              </TextLink>
            </span>
          </Row>
          <Row caption="Inherit">
            <span className="inline-block rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">
              Your trial ends in 3 days.{" "}
              <TextLink tone="inherit" href="#plans" className="whitespace-nowrap">
                Pick a plan
              </TextLink>
            </span>
          </Row>
          <Row caption="External">
            <TextLink href="https://status.northwind.dev" external>
              Northwind status page
            </TextLink>
          </Row>
          <Row caption="Your own link">
            {/* asChild puts the look on any link element: this <a> stands for the Link of your framework. */}
            <TextLink asChild external>
              <a href="https://northwind.dev/changelog">Open the changelog</a>
            </TextLink>
          </Row>
          <Row caption="Download">
            <span className="grid gap-1.5">
              <TextLink href="/files/northwind-annual-report-2025.pdf" download={{ type: "PDF", size: 2_411_000 }}>
                Annual report 2025
              </TextLink>
              <TextLink href="/files/invoices-q3.csv" download={{ filename: "northwind-invoices-q3.csv", type: "CSV", size: 184_320 }}>
                Invoices, third quarter
              </TextLink>
            </span>
          </Row>
          <Row caption="Current page">
            <span className="inline-flex flex-wrap gap-x-5 gap-y-1">
              <TextLink tone="subtle" href="#overview" current>
                Overview
              </TextLink>
              <TextLink tone="subtle" href="#usage">
                Usage
              </TextLink>
              <TextLink tone="subtle" href="#members">
                Members
              </TextLink>
            </span>
          </Row>
          <Row caption="Disabled">
            <TextLink href="#sales" disabled>
              Contact sales
            </TextLink>
            <span className="ml-2 text-xs text-muted-foreground">Opens Monday</span>
          </Row>
          <Row caption="Other language">
            <TextLink href="#de" hrefLang="de">
              Datenschutzerklärung
            </TextLink>
          </Row>
          <Row caption="When it wraps">
            <span className="block max-w-[12.5rem]">
              <TextLink href="https://northwind.dev/legal/terms" external>
                Read the full terms of service for Northwind Cloud
              </TextLink>
              <span className="mt-2 block text-xs text-muted-foreground">Tab to it: the ring follows every line, and the arrow never sits alone.</span>
            </span>
          </Row>
        </dl>
      </div>
    </div>
  );
}
