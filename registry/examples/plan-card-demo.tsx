"use client";

import { useState } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { PlanCard } from "@rhs-ui/commerce/plan-card";

type Billing = "monthly" | "yearly";

const BILLING = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly, save 17%" },
] as const;

export default function Demo(): React.JSX.Element {
  const [billing, setBilling] = useState<Billing>("yearly");
  const [chosen, setChosen] = useState<string | null>(null);
  const yearly = billing === "yearly";

  return (
    <div className="@container grid w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-8">
      <div className="flex justify-center">
        <SegmentedControl label="Billing interval" options={BILLING} value={billing} onValueChange={(value) => setBilling(value === "monthly" ? "monthly" : "yearly")} />
      </div>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 @3xl:grid-cols-3">
        <PlanCard
          name="Starter"
          description="For a first project and anyone still finding out what they need."
          price={{ amount: 0, interval: "month", note: "Free for ever, no card needed" }}
          features={["One workspace", "Three active projects", "Community support", { label: "Audit log", included: false }]}
          current
        />
        <PlanCard
          name="Studio"
          description="For a team that ships every week and wants the full toolkit."
          price={{
            amount: yearly ? 2400 : 2900,
            interval: "month",
            note: yearly ? "€288 billed yearly, save 17%" : "Billed monthly, cancel any time",
          }}
          features={["Unlimited projects", "Roles and approvals", "Priority support, same day", "Audit log for 12 months", { label: "SSO and SAML", included: false }]}
          recommended
          cta={{ label: "Choose Studio", onClick: () => setChosen(`Studio, billed ${billing}`) }}
        />
        <PlanCard
          name="Scale"
          description="For organisations with security reviews, many teams and a contract."
          price={{ amount: "Custom", note: "Volume pricing on an annual contract" }}
          features={["Everything in Studio", "SSO and SAML", "Dedicated success manager", "99.9% uptime SLA"]}
          cta={{ label: "Talk to sales", href: "#sales" }}
        />
      </div>

      <p role="status" className="min-h-5 text-center text-sm text-muted-foreground">
        {chosen ? `You chose ${chosen}. This is a demo, so no payment is taken.` : "Flip the billing interval to watch the price count."}
      </p>
    </div>
  );
}
