"use client";

import { useId, useState, type ReactNode } from "react";

import { Label } from "@rhs-ui/primitives/label";
import { VariableTextarea, type TemplateVariable, type VariableTextareaProps } from "@rhs-ui/primitives/variable-textarea";

function Example({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const VARIABLES: TemplateVariable[] = [
  { key: "first_name", label: "First name", sample: "Marit" },
  { key: "order_number", label: "Order number", sample: "NW-10482" },
  { key: "delivery_date", label: "Delivery date", sample: "Thursday 29 October" },
  { key: "tracking_url", label: "Tracking link", sample: "northwind.example/t/8f2k1" },
  { key: "store_name", label: "Store name", sample: "Northwind" },
];

const SHIPPED = [
  "Hi {{first_name}},",
  "",
  "Good news: order {{order_number}} is on its way and should arrive on {{delivery_date}}.",
  "Follow it here: {{tracking_url}}",
  "",
  "Thanks for shopping with {{store_name}}.",
].join("\n");

function Field({ label, ...props }: Omit<VariableTextareaProps, "id" | "variables"> & { label: string }): React.JSX.Element {
  const id = useId();
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <VariableTextarea id={id} variables={VARIABLES} {...props} />
    </div>
  );
}

function ShippedEmail(): React.JSX.Element {
  const id = useId();
  const [template, setTemplate] = useState(SHIPPED);
  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.02em]">Shipping confirmation</h2>
        <p className="text-xs text-muted-foreground">Sent the moment an order leaves the warehouse.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id}>Email body</Label>
        <VariableTextarea id={id} name="body" variables={VARIABLES} rows={8} value={template} onValueChange={setTemplate} />
      </div>
      {/* What the field reported is for the reader of the demo, so a screen reader is not read it on every key. */}
      <p aria-hidden="true" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Reported, the raw template</span>
        <code className="font-mono text-[0.6875rem] text-foreground">{template.length} characters</code>
      </p>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      {/* Two columns of about the same height, so the sheet has no empty corner. */}
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: click in the text, then Insert variable. The token lands at the caret and replaces a selection. Preview fills in the samples">
          <ShippedEmail />
        </Example>
        <Example caption="Read only: the text can be read and previewed, but not changed or filled in from the menu">
          <Field label="Approved template" rows={3} readOnly defaultValue="Hi {{first_name}}, your order {{order_number}} is ready to collect at {{store_name}}." />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="A typo is flagged in words, with the nearest real variable offered">
          <Field label="Reminder" rows={3} defaultValue="Hi {{frist_name}}, your order {{order_number}} is ready to collect." />
        </Example>
        <Example caption="The preview, with the typo left as written">
          <Field label="Reminder preview" rows={3} defaultPreview defaultValue="Hi {{first_name}}, your order {{order_numbr}} is ready to collect at {{store_name}}." />
        </Example>
        <Example caption="Other delimiters, and a limit: a variable that no longer fits is disabled in the menu">
          <Field label="Text message" rows={3} delimiters={["%", "%"]} maxLength={72} defaultValue="Hi %first_name%, order %order_number% ships %delivery_date%." />
        </Example>
      </div>
    </div>
  );
}
