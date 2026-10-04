import { FeatureNumbers } from "@rhs-ui/marketing/feature-numbers";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-6">
      <FeatureNumbers
        title="Four reasons teams stay."
        description="We asked 140 customers why they renewed. These came up the most."
        features={[
          { title: "It stays fast", description: "Every screen under 100 ms, even with ten thousand tasks. Speed is a feature people feel every day." },
          { title: "Decisions have a home", description: "The why lives next to the work, so new people catch up by reading, not by asking." },
          { title: "It is quiet", description: "No notifications after six, a Monday summary instead of a hundred pings." },
          { title: "Support answers", description: "A median first reply of eight minutes, from people who build the product." },
        ]}
      />
    </div>
  );
}
