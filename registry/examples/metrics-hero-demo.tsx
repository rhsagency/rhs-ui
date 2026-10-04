import { Button } from "@rhs-ui/primitives/button";
import { MetricsHero } from "@rhs-ui/marketing/metrics-hero";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <MetricsHero
        eyebrow="Payments infrastructure"
        title="Get paid in every market you sell to."
        description="One integration for cards, wallets and local methods, with payouts in 38 currencies."
        actions={
          <>
            <Button size="lg">Create an account</Button>
            <Button size="lg" variant="ghost">Read the docs</Button>
          </>
        }
        metrics={[
          { value: "99.99%", label: "API uptime, last 12 months" },
          { value: "135+", label: "Payment methods" },
          { value: "38", label: "Payout currencies" },
          { value: "1.2 s", label: "Median checkout" },
        ]}
      />
    </div>
  );
}
