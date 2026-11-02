"use client";

import { useId, useState, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { CodeField, type CodeFieldProps, type CodeValidation } from "@rhs-ui/primitives/code-field";
import { Label } from "@rhs-ui/primitives/label";

function Example({ caption, className, children }: { caption: ReactNode; className?: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className={`grid min-w-0 grid-cols-1 content-start gap-3 ${className ?? ""}`}>
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Field({ label, ...props }: Omit<CodeFieldProps, "id"> & { label: string }): React.JSX.Element {
  const id = useId();
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <CodeField id={id} {...props} />
    </div>
  );
}

const PAYLOAD = `{
  "event": "order.created",
  "id": "evt_8f2k1",
  "data": {
    "order": "NW-10482",
    "total": 129.5,
    "currency": "EUR",
    "items": [
      { "sku": "KES-2210", "quantity": 1 },
      { "sku": "HAL-1042", "quantity": 2 }
    ]
  }
}`;

const MINIFIED = '{"event":"order.shipped","id":"evt_7c93q","data":{"order":"NW-10482","carrier":"PostNL","tracking":"3SKEST4821903","items":[{"sku":"KES-2210","quantity":1},{"sku":"HAL-1042","quantity":2}]}}';

const BROKEN = `{
  "event": "refund.created",
  "data": {
    "order": "NW-10311",
    "amount": 48.5,
  }
}`;

const STYLES = `.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: #111;
  color: #fff;
  font-size: 12px;
}`;

const RESPONSE = `{
  "status": 200,
  "delivered": true,
  "attempts": 1,
  "duration_ms": 184
}`;

function Webhook(): React.JSX.Element {
  const id = useId();
  const [body, setBody] = useState(PAYLOAD);
  const [verdict, setVerdict] = useState<CodeValidation | null>(null);
  const [sent, setSent] = useState(false);
  const ready = verdict === null || verdict.valid;
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (ready) setSent(true);
      }}
      className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs"
    >
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.02em]">Test the Northwind webhook</h2>
        <p className="text-xs text-muted-foreground">Edit the body and send it to https://hooks.halcyon.example/orders.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id}>Request body</Label>
        <CodeField
          id={id}
          name="body"
          language="json"
          rows={13}
          value={body}
          onValueChange={(next) => {
            setBody(next);
            setSent(false);
          }}
          onValidate={setVerdict}
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button type="submit" disabled={!ready}>
          Send test event
        </Button>
        <p role="status" className="text-xs text-muted-foreground">
          {sent ? "Sent. Halcyon answered 200 in 184 ms." : ready ? "Ready to send." : "Fix the JSON to send it."}
        </p>
      </div>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <Example className="md:col-span-2" caption="Try it: Tab indents the line or the selection, Shift+Tab takes it back, Enter keeps the indentation. Break the JSON and wait a moment, or press Format">
        <Webhook />
      </Example>

      <Example caption="A mistake is named with its line and column. The line is marked in the gutter and across the text, and the link jumps to it">
        <Field label="Refund event" language="json" rows={7} defaultValue={BROKEN} />
      </Example>
      <Example caption="One long line, then Format. Every digit and the order of the keys stay as written">
        <Field label="Shipping event" language="json" rows={7} defaultValue={MINIFIED} />
      </Example>
      <Example caption="Plain, for CSS or any other text: the gutter, the indentation and the status row, with no checking">
        <Field label="Badge styles" rows={9} defaultValue={STYLES} />
      </Example>
      <Example caption="Read only, for a response you want people to read and copy">
        <Field label="Response" language="json" rows={6} readOnly defaultValue={RESPONSE} />
      </Example>
    </div>
  );
}
