"use client";

import { IconShieldCheck, IconWorkflow, IconZap } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { ApiCodeSection } from "@rhs-ui/marketing/api-code-section";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <ApiCodeSection
        eyebrow="For developers"
        title="Send your first invoice in four lines."
        description="A REST API with idempotent writes and signed webhooks, so retries never bill twice."
        points={[
          { icon: <IconZap />, text: "Median response under 80 ms" },
          { icon: <IconShieldCheck />, text: "Signed webhooks, replay-safe" },
          { icon: <IconWorkflow />, text: "SDKs for Node, Python and Go" },
        ]}
        actions={<Button variant="outline">Read the API docs</Button>}
        samples={[
          { label: "cURL", code: `curl https://api.example.com/v1/invoices \\\n  -H "Authorization: Bearer $API_KEY" \\\n  -H "Idempotency-Key: inv-2041" \\\n  -d customer=cus_81 -d amount=4900` },
          { label: "Node", code: `const invoice = await client.invoices.create(\n  { customer: "cus_81", amount: 4900 },\n  { idempotencyKey: "inv-2041" },\n);` },
          { label: "Python", code: `invoice = client.invoices.create(\n    customer="cus_81",\n    amount=4900,\n    idempotency_key="inv-2041",\n)` },
        ]}
      />
    </div>
  );
}
