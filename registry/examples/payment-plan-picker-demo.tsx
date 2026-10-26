"use client";

import { useState, type ReactNode } from "react";

import { PaymentPlanPicker, type PaymentPlan } from "@rhs-ui/commerce/payment-plan-picker";

/** An order of 1,199.00. 3 and 4 payments cost nothing extra, 6 and 12 carry interest, and the first payment takes the cents that do not divide. */
const TOTAL = 119_900;

const PLANS: readonly PaymentPlan[] = [
  { id: "full", payments: 1, amount: 119_900, total: 119_900 },
  { id: "3", payments: 3, amount: 39_966, total: 119_900 },
  { id: "6", payments: 6, amount: 20_541, total: 123_250, apr: 9.9 },
  { id: "12", payments: 12, amount: 10_750, total: 129_000, apr: 14.9 },
];

const DISCLOSURE = (
  <>
    <strong className="font-medium text-foreground">Representative example.</strong> Borrowing €1,199.00 over 6 months at a representative APR of 9.9% (fixed), you pay a first payment of €205.45, then 5 monthly payments of €205.41, and a total amount payable of €1,232.50. Credit
    is provided by Northwind Pay Ltd, subject to status and affordability. Missing a payment may affect your credit rating.
  </>
);

const LATER: readonly PaymentPlan[] = [
  { id: "full", payments: 1, amount: 8_900, total: 8_900, label: "Pay now" },
  { id: "later", payments: 4, amount: 2_225, total: 8_900, firstPaymentToday: false, label: "Pay in 4, starting next month" },
];

function Example({ caption, note, children }: { caption: string; note?: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
      {note ? (
        <p role="status" className="text-xs text-muted-foreground">
          {note}
        </p>
      ) : null}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [log, setLog] = useState("Choose a plan: the schedule under the cards follows it, and the total, the interest and the rate with it.");
  return (
    <div className="mx-auto grid w-full max-w-3xl min-w-0 gap-16 px-4 py-10 sm:px-6 sm:py-14">
      <Example caption="A checkout step for a €1,199.00 order: four ways to pay, the schedule of the chosen one and the fine print, which is never hidden" note={log}>
        <PaymentPlanPicker
          total={TOTAL}
          plans={PLANS}
          defaultValue="6"
          currency="EUR"
          locale="en-GB"
          timeZone="Europe/Amsterdam"
          now="2026-10-26"
          disclosure={DISCLOSURE}
          onValueChange={(id) => setLog(`onValueChange("${id}")`)}
          onContinue={(plan) => setLog(`onContinue: ${plan.id} (${plan.payments} payment${plan.payments === 1 ? "" : "s"}, ${(plan.total / 100).toFixed(2)} in total)`)}
        />
      </Example>

      <div className="grid min-w-0 gap-x-10 gap-y-16 md:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] md:items-start">
        <Example caption="A plan that starts in a month: the first payment is not today, and the schedule says so">
          <PaymentPlanPicker
            headingAs="h3"
            title="Pay later"
            total={8_900}
            plans={LATER}
            defaultValue="later"
            currency="EUR"
            locale="en-GB"
            timeZone="Europe/Amsterdam"
            now="2026-10-26"
            disclosure="Pay in 4 is interest-free. Northwind Pay Ltd is authorised and regulated by the Financial Conduct Authority."
          />
        </Example>
        <Example caption="In a narrow column the cards and the twelve payments stack">
          <PaymentPlanPicker
            headingAs="h3"
            title="Your plan"
            description="Twelve monthly payments."
            total={TOTAL}
            plans={PLANS.slice(2)}
            defaultValue="12"
            currency="EUR"
            locale="en-GB"
            timeZone="Europe/Amsterdam"
            now="2026-10-26"
          />
        </Example>
      </div>
    </div>
  );
}
