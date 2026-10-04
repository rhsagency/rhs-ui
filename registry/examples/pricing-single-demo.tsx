import { Button } from "@rhs-ui/primitives/button";
import { PricingSingle } from "@rhs-ui/marketing/pricing-single";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <PricingSingle
        eyebrow="Pricing"
        title="One price. Everything in it."
        description="No tiers to compare and no feature you will need next month locked behind a sales call."
        planName="Field Notes Pro"
        price="€8"
        period="per month"
        action={<Button size="lg">Start 30-day trial</Button>}
        note="Cancel any time. Your notes stay yours."
        features={["Unlimited notebooks", "Sync across all devices", "End-to-end encryption", "Export to Markdown and PDF", "Priority support"]}
      />
    </div>
  );
}
