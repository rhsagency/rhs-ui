import type { ReactNode } from "react";

import { FeatureOutcomes } from "@rhs-ui/marketing/feature-outcomes";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="mb-8 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Example caption="Five features, each with the number it moved and the customer who measured it. A signed figure is read out as up or down, and the note says how and when it was measured">
        <FeatureOutcomes
          eyebrow="Results"
          title="What changed for teams that switched each feature on"
          description="Every figure comes from a customer who measured it themselves, and every customer is named."
          items={[
            { feature: "Shared inboxes", href: "#shared-inboxes", description: "One inbox, one owner per thread, so nothing is answered twice.", metric: { value: "-38%", label: "first reply time" }, customer: "Northwind" },
            { feature: "Rules and automation", href: "#rules", description: "Route, tag and reply to routine requests without a line of code.", metric: { value: "+31%", label: "tickets closed per agent" }, customer: "Kestrel Freight" },
            { feature: "Knowledge base", href: "#knowledge-base", description: "Answers customers can find on their own, written in the same editor.", metric: { value: "-27%", label: "tickets per 1,000 customers" }, customer: "Fernhill Energy" },
            { feature: "Scheduled digests", href: "#digests", description: "A Monday summary in everyone's inbox, built from live numbers.", metric: { value: "11 hrs", label: "saved each week on reporting" }, customer: "Polder & Co" },
            { feature: "Single sign-on", href: "#sso", description: "Sign in through your identity provider and manage access in one place.", metric: { value: "9 days", label: "to pass a security review" }, customer: "Lumen Optics" },
          ]}
          note="Median change per workspace, measured by each customer over the 90 days before and after switching the feature on. Figures from March to September 2026, published with permission."
        />
      </Example>
      <div className="mx-auto mt-20 max-w-2xl border-t border-border pt-12 sm:mt-24">
        <Example caption="In a narrow column, with three rows and no note: the rows stack as feature, description and figure">
          <FeatureOutcomes
            headingLevel={3}
            title="Results from agencies"
            items={[
              { feature: "Guest access", href: "#guests", description: "Clients see their own project and nothing else.", metric: { value: "+22%", label: "approvals on the first round" }, customer: "Fernhill Studio" },
              { feature: "Workload view", description: "See who is overloaded before the week starts.", metric: { value: "-35%", label: "overtime hours a month" }, customer: "Kestrel Freight" },
              { feature: "Time reports", href: "#time", description: "Estimates against actuals, per project.", metric: { value: "3 hrs", label: "saved on each client invoice" }, customer: "Polder & Co" },
            ]}
          />
        </Example>
      </div>
    </div>
  );
}
