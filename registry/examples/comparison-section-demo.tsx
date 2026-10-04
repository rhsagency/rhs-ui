import { ComparisonSection } from "@rhs-ui/marketing/comparison-section";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <ComparisonSection
        eyebrow="Why switch"
        title="Less juggling, more finished work"
        afterLabel="With Ledger"
        rows={[
          { topic: "Status updates", before: "A weekly meeting and a slide deck", after: "A live page that writes itself" },
          { topic: "Finding decisions", before: "Search three chat tools and hope", after: "Every decision linked to its work" },
          { topic: "Onboarding", before: "Two weeks of shadowing", after: "A guided tour of the real workspace" },
          { topic: "Cost", before: "Four subscriptions", after: "One plan, per active person" },
        ]}
      />
    </div>
  );
}
