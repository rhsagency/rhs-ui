"use client";

import type { ReactNode } from "react";

import { PromoCodeCta } from "@rhs-ui/marketing/promo-code-cta";

/**
 * The clock is fixed, so the three examples stay in the state their captions describe whatever day this page is read,
 * and the first paint on the server is the same as in the browser. On a real page leave `now` out when the page is built
 * once, or pass the request's time when it is rendered per request.
 */
const shared = {
  locale: "en-GB",
  timeZone: "Europe/Amsterdam",
  terms: "#terms",
  now: "2026-10-26T09:00:00Z",
} as const;

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="mb-6 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <div className="grid gap-y-14">
        <Example caption="While it runs: the headline, the conditions, a real end date with its time zone, the terms and a code to copy">
          <PromoCodeCta
            {...shared}
            title="20 percent off annual plans"
            description="Switch to annual billing and keep the discount for your whole first year. It applies to the Team and Business plans."
            code="ANNUAL20"
            endsAt="2027-06-30"
            action={{ label: "Choose annual billing", href: "#pricing" }}
          />
        </Example>
        <Example caption="After the end date: the band says so and the code is gone from the page">
          <PromoCodeCta
            {...shared}
            title="Early bird: 30 percent off the first year"
            description="Applied to every plan for teams that joined before the end of March."
            code="EARLYBIRD30"
            endsAt="2026-03-31"
            action={{ label: "See pricing", href: "#pricing" }}
          />
        </Example>
        <Example caption="Smallest form: a headline, a code, a date and the terms">
          <PromoCodeCta {...shared} headingLevel={3} title="Free delivery on orders over €50" code="DELIVERY50" endsAt="2027-01-15T22:59:00Z" />
        </Example>
      </div>
    </div>
  );
}
