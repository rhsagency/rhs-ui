"use client";

import type { ReactNode } from "react";

import { WelcomeOfferSignup, type WelcomeOfferResult } from "@rhs-ui/marketing/welcome-offer-signup";

const offer = {
  title: "10% off your first order",
  description: "Join the Kestrel list and we show your code right away: for your first bag of beans, and for whatever else we roast.",
  terms: ["Minimum spend €25", "Valid for 30 days after you sign up", "One use per customer, not combinable with other codes"],
};

const consent = (
  <>
    You agree to marketing emails from Kestrel Coffee. Leave with one click, any time.{" "}
    <a href="#privacy" className="rounded-sm text-foreground underline decoration-foreground/40 underline-offset-4 outline-none hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40">
      Privacy policy
    </a>
  </>
);

/** The code only comes back with the response. This address is already on the list, so it gets the same code and a welcome back. */
function issueCode(email: string): Promise<WelcomeOfferResult> {
  const known = email.toLowerCase() === "maria@halcyon.studio";
  return new Promise((resolve) => setTimeout(() => resolve(known ? { code: "KESTREL10", returning: true } : { code: "KESTREL10" }), 800));
}

const shared = { offer, consent, onSubmit: issueCode, action: { href: "#shop" } } as const;

/** A column that fills its row, so two examples side by side end on the same line. */
function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="flex min-w-0 flex-col">
      <p className="mb-6 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Example caption="Try it: any address shows the code, and maria@halcyon.studio is already on the list and is welcomed back">
        <WelcomeOfferSignup {...shared} />
      </Example>
      <div className="mt-16 grid gap-x-8 gap-y-14 border-t border-border pt-12 lg:grid-cols-2">
        <Example caption="After signing up: the code to copy, the conditions and the way back to the shop">
          <WelcomeOfferSignup {...shared} headingLevel={3} className="flex-1" defaultResult={{ email: "sam@halcyon.studio", code: "KESTREL10" }} />
        </Example>
        <Example caption="A returning subscriber: the same path, with Welcome back wording">
          <WelcomeOfferSignup {...shared} headingLevel={3} className="flex-1" defaultResult={{ email: "maria@halcyon.studio", code: "KESTREL10", returning: true }} />
        </Example>
      </div>
    </div>
  );
}
