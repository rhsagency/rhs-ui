import { Button } from "@rhs-ui/primitives/button";
import { PlanUsage } from "@rhs-ui/application/plan-usage";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-lg p-6">
      <PlanUsage
        plan="Team plan"
        period="Renews on 1 April"
        action={<Button size="sm" variant="outline">Upgrade</Button>}
        lines={[
          { id: "seats", label: "Seats", used: 8, limit: 10 },
          { id: "storage", label: "Storage", used: 42, limit: 100 },
          { id: "runs", label: "Automation runs", used: 5000, limit: 5000 },
        ]}
      />
    </div>
  );
}
