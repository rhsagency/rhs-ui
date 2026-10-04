"use client";

import { Button } from "@rhs-ui/primitives/button";
import { ResultState } from "@rhs-ui/primitives/result-state";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-4xl gap-6 p-8 md:grid-cols-2">
      <ResultState
        tone="success"
        title="Payment received"
        description="We sent the receipt to your inbox. Your plan is active right away."
        reference="PAY-58213"
        actions={<Button>Go to dashboard</Button>}
      />
      <ResultState tone="error" title="The card was declined" description="Nothing was charged. Check the card details or use another card." onRetry={() => undefined} />
    </div>
  );
}
