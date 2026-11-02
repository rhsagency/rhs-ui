import type { ReactNode } from "react";

import { RolloutPlan } from "@rhs-ui/marketing/rollout-plan";

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
      <Example caption="Six milestones on a clock: the first is the start, the last is the outcome, and every row says in words who does the work. The heading sits beside the plan on a wide section">
        <RolloutPlan
          title="What happens after you sign"
          description="Ninety days from signed order form to your first review, with who does what at every step. Nothing here needs a developer on your side."
          milestones={[
            {
              when: "Day 1",
              title: "Kickoff call",
              description: "A 45-minute call with your support lead and our onboarding manager to agree who needs access and which tools to connect.",
              owner: "both",
            },
            {
              when: "Day 3",
              title: "Workspace ready",
              description: "We create your workspace, import twelve months of tickets from your current helpdesk and set up single sign-on.",
              owner: "us",
            },
            {
              when: "Week 2",
              title: "Connect your channels",
              description: "Your IT admin points the support address and the website chat at Halcyon and invites the first ten agents. We stay on a call while it happens.",
              owner: "you",
            },
            {
              when: "Week 3",
              title: "Pilot with one team",
              description: "One team handles live tickets while we tune routing rules and saved replies, with a 15-minute check-in every morning.",
              owner: "both",
            },
            {
              when: "Day 30",
              title: "Everyone is live",
              description: "The remaining agents move over and the old inbox is switched off. We watch the dashboards with you for the first two weeks.",
              owner: "you",
            },
            {
              when: "Day 90",
              title: "First review",
              description: "We compare first-reply time and tickets per agent with your baseline. Most teams have earned back the setup cost by now.",
              owner: "us",
            },
          ]}
          note="Dates assume a signed order form by the 1st of the month. Moving from a second helpdesk adds up to two weeks to the import."
        />
      </Example>

      <div className="mt-20 max-w-md border-t border-border pt-12 sm:mt-24">
        <Example caption="Four milestones in a narrow column: the time labels stack above the titles, and the payback is flagged where it happens">
          <RolloutPlan
            headingLevel={3}
            title="Moving your books to Kestrel"
            description="Your accountant keeps working in the old system until you both agree the numbers match."
            milestones={[
              { when: "Day 1", title: "Share read-only access", description: "You invite our migration team to your current bookkeeping file. We cannot change anything in it.", owner: "you" },
              { when: "Week 1", title: "Import and reconcile", description: "We bring over two years of invoices and bank lines, then reconcile every account against your last closed month.", owner: "us" },
              { when: "Week 2", title: "Run both side by side", description: "Your accountant checks the first month in both systems and signs off on the differences we list.", owner: "both" },
              { when: "Day 30", title: "Switch over", description: "You close the old file and send invoices from Kestrel. Your first VAT return is prepared there.", owner: "both", outcome: true },
            ]}
          />
        </Example>
      </div>
    </div>
  );
}
