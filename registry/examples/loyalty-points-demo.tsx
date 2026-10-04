import { Button } from "@rhs-ui/primitives/button";
import { LoyaltyPoints } from "@rhs-ui/commerce/loyalty-points";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-sm p-8">
      <LoyaltyPoints
        points={640}
        earnRule="1 point per €1 spent"
        action={<Button size="sm" variant="outline">See rewards</Button>}
        rewards={[{ points: 250, label: "a free tea towel" }, { points: 500, label: "€10 off" }, { points: 1000, label: "€25 off" }, { points: 2000, label: "a linen apron" }]}
      />
    </div>
  );
}
