import { FeatureChecklist } from "@rhs-ui/marketing/feature-checklist";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <FeatureChecklist
        eyebrow="Everything included"
        title="All of it, on every plan"
        description="No feature gates on the basics. Plans differ in seats and storage, not in what you can do."
        groups={[
          { title: "Selling", items: ["Online shop and checkout", "Gift cards and discount codes", "Local pickup and delivery slots"] },
          { title: "Running", items: ["Stock across locations", "Staff accounts with roles", "Daily close-out report"] },
          { title: "Getting paid", items: ["Cards, wallets and iDEAL", "Payouts every working day", "Exports for your accountant"] },
        ]}
        aside={<>Migrating from another platform? We move your products and customers for free.</>}
      />
    </div>
  );
}
