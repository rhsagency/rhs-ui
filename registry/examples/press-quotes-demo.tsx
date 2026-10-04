import { PressQuotes } from "@rhs-ui/marketing/press-quotes";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <PressQuotes
        quotes={[
          { outlet: "The Design Weekly", quote: "The calmest project tool we have used this year.", href: "#design-weekly" },
          { outlet: "Startup Ledger", quote: "Finally, a roadmap that is not a week out of date.", href: "#startup-ledger" },
          { outlet: "Workplace Review", quote: "Quietly brilliant, and priced like it wants you to stay.", href: "#workplace-review" },
        ]}
      />
    </div>
  );
}
