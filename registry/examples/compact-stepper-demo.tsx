"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { CompactStepper, type CompactStep } from "@rhs-ui/primitives/compact-stepper";

const CHECKOUT: readonly CompactStep[] = [
  { id: "cart", label: "Cart", description: "3 items, 214.00 EUR" },
  { id: "shipping", label: "Shipping", description: "Standard delivery, 2 to 3 days" },
  { id: "payment", label: "Payment", description: "Visa ending 4242" },
  { id: "review", label: "Review", description: "Check the order before you pay" },
  { id: "confirmation", label: "Confirmation", description: "Your receipt arrives by email" },
];

const BODY = [
  "Three items from Halcyon Home. Free returns for 30 days.",
  "Deliver to Mara Okafor, Keizersgracht 214, Amsterdam.",
  "Pay with the Visa ending 4242, or choose another card.",
  "Review the order, the address and the total of 214.00 EUR.",
  "Thank you. Your order Northwind-48213 is confirmed.",
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </section>
  );
}

const card = "rounded-xl border border-border bg-card p-4 text-card-foreground sm:p-5";

function Checkout(): React.JSX.Element {
  const [current, setCurrent] = useState(1);
  return (
    <div className={`${card} grid gap-5`}>
      <CompactStepper steps={CHECKOUT} current={current} allowJumpBack onStepSelect={(_, index) => setCurrent(index)} />
      <p className="min-h-10 text-sm leading-relaxed text-muted-foreground">{BODY[current]}</p>
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" disabled={current === 0} onClick={() => setCurrent((now) => Math.max(0, now - 1))}>
          Back
        </Button>
        <Button type="button" onClick={() => setCurrent((now) => Math.min(CHECKOUT.length - 1, now + 1))} disabled={current === CHECKOUT.length - 1}>
          Continue
        </Button>
      </div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="w-full">
      <div className="mx-auto grid w-full max-w-md gap-10">
        <Example caption="A checkout in a narrow card. Open All steps: finished steps are links back, upcoming ones are plain text.">
          <Checkout />
        </Example>
        <Example caption="A step that needs attention says so in words, in the list and under the bar, as well as in colour.">
          <div className={card}>
            <CompactStepper
              current={3}
              allowJumpBack
              steps={CHECKOUT.map((step) => (step.id === "payment" ? { ...step, state: "error" as const, description: "The card was declined" } : step))}
            />
          </div>
        </Example>
        <Example caption="size sm, in a narrow column.">
          <div className={`${card} max-w-[15rem]`}>
            <CompactStepper current={2} size="sm" steps={CHECKOUT} />
          </div>
        </Example>
      </div>
    </div>
  );
}
