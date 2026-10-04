import { TimelineSection } from "@rhs-ui/marketing/timeline-section";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <TimelineSection
        eyebrow="Roadmap"
        title="Where we came from, and where we are going"
        milestones={[
          { when: "2021", title: "First customer", description: "A bakery in Utrecht, still with us." },
          { when: "2023", title: "Team of eight", description: "Our first designer and our first support hire." },
          { when: "2025", title: "1,000 shops", description: "Across nine countries, without a sales team." },
          { when: "Q2 2026", title: "Public API", description: "Webhooks and a REST API on every plan.", upcoming: true },
          { when: "Q4 2026", title: "Offline mode", description: "Keep selling when the connection drops.", upcoming: true },
        ]}
      />
    </div>
  );
}
