"use client";

import { Button } from "@rhs-ui/primitives/button";
import { ErrorPanel } from "@rhs-ui/primitives/error-panel";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-lg p-8">
      <ErrorPanel
        title="We could not load your invoices."
        description="Our billing service did not answer in time. Your data is safe; try again in a moment."
        onRetry={() => undefined}
        reference="req_7K2M4QX9"
        actions={<Button size="sm" variant="outline">Contact support</Button>}
      />
    </div>
  );
}
