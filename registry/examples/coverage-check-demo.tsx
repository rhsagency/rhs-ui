"use client";

import type { ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { CoverageCheck, type CoverageResult } from "@rhs-ui/marketing/coverage-check";

const covered: CoverageResult = {
  status: "available",
  message: "Your box is packed on Monday and at your door the next morning, in a window you choose.",
  details: [
    { label: "Delivery days", value: "Tuesday and Friday" },
    { label: "Next delivery", value: "Tuesday 3 November" },
    { label: "Delivery fee", value: "Free over €45" },
  ],
};

const notYet: CoverageResult = {
  status: "not-yet",
  message: "Our vans do not drive there yet. We open new routes every few months, starting where the most people are waiting.",
  details: [{ label: "People waiting in 9401", value: "212" }],
};

const unknown: CoverageResult = {
  status: "unknown",
  message: "That postcode is not in our system. Check the digits and letters, or write to hello@northwind.example and we will look at the street by hand.",
};

/** A lookup that takes a moment and answers, so the busy state and all three answers can be tried. */
function lookup(query: string): Promise<CoverageResult> {
  const code = query.replace(/\s+/g, "").toUpperCase();
  const answer = code.startsWith("35") ? covered : code.startsWith("94") ? notYet : unknown;
  return new Promise((resolve) => setTimeout(() => resolve(answer), 700));
}

const notify = () => new Promise<void>((resolve) => setTimeout(resolve, 600));

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="mb-6 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const shared = {
  label: "Postcode",
  placeholder: "3511 AB",
  onCheck: lookup,
  onNotify: notify,
  headingLevel: 3,
} as const;

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Example caption="Try it: 3511 AB is covered, 9401 AB is not yet, anything else cannot be matched">
        <CoverageCheck
          {...shared}
          headingLevel={2}
          title="Do we deliver to you?"
          description="Northwind Greens brings a weekly box of vegetables from two farms near Utrecht. Enter your postcode and we will tell you."
          hint="We only use your postcode to look up our routes."
          action={
            <Button asChild>
              <a href="#build-box">Build my first box</a>
            </Button>
          }
        />
      </Example>

      <div className="mt-16 grid gap-x-8 gap-y-14 border-t border-border pt-12 xl:grid-cols-3">
        <Example caption="Covered: what it means, and the next step">
          <CoverageCheck
            {...shared}
            title="Do we deliver to you?"
            defaultValue="3511 AB"
            defaultResult={covered}
            action={
              <Button asChild>
                <a href="#build-box">Build my first box</a>
              </Button>
            }
          />
        </Example>
        <Example caption="Not yet: an honest no, and a way to hear later">
          <CoverageCheck {...shared} title="Do we deliver to you?" defaultValue="9401 AB" defaultResult={notYet} />
        </Example>
        <Example caption="Unknown: it asks for the address to be checked">
          <CoverageCheck {...shared} title="Do we deliver to you?" defaultValue="0000 XX" defaultResult={unknown} />
        </Example>
      </div>
    </div>
  );
}
