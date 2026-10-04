import { TimelineHorizontal } from "@rhs-ui/primitives/timeline-horizontal";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-4xl p-8">
      <TimelineHorizontal
        label="2026 roadmap"
        milestones={[
          { id: "1", when: "Q1 2026", title: "Decision log", description: "Shipped to every workspace.", status: "done" },
          { id: "2", when: "Q2 2026", title: "Guest links", description: "Share read-only with clients.", status: "done" },
          { id: "3", when: "Q2 2026", title: "Onboarding v2", description: "In beta with 50 teams.", status: "current" },
          { id: "4", when: "Q3 2026", title: "Mobile app", description: "iOS first, Android after.", status: "next" },
          { id: "5", when: "Q4 2026", title: "SSO for everyone", description: "Down from the Business plan.", status: "next" },
        ]}
      />
    </div>
  );
}
