import { Button } from "@rhs-ui/primitives/button";
import { PricingTable } from "@rhs-ui/marketing/pricing-table";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <PricingTable
        plans={[
          { id: "starter", name: "Starter", price: "€0", period: "for up to 3 people", action: <Button variant="outline" className="w-full">Start free</Button> },
          { id: "team", name: "Team", price: "€12", period: "per person, per month", action: <Button className="w-full">Try Team</Button>, highlighted: true },
          { id: "business", name: "Business", price: "€24", period: "per person, per month", action: <Button variant="outline" className="w-full">Contact sales</Button> },
        ]}
        groups={[
          {
            title: "Workspace",
            rows: [
              { feature: "Projects", values: { starter: "5", team: "Unlimited", business: "Unlimited" } },
              { feature: "File storage", values: { starter: "2 GB", team: "100 GB", business: "1 TB" } },
              { feature: "Guests", values: { starter: false, team: true, business: true } },
            ],
          },
          {
            title: "Security",
            rows: [
              { feature: "Two-factor sign-in", values: { starter: true, team: true, business: true } },
              { feature: "Single sign-on (SAML)", values: { starter: false, team: false, business: true } },
              { feature: "Audit log", values: { starter: false, team: "30 days", business: "1 year" } },
            ],
          },
        ]}
      />
    </div>
  );
}
