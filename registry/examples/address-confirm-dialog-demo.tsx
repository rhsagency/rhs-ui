"use client";

import { useRef, useState, type ReactNode } from "react";

import { AddressConfirmDialog, AddressConfirmPanel, type AddressLine } from "@rhs-ui/commerce/address-confirm-dialog";
import { compareAddresses } from "@rhs-ui/commerce/address-confirm-dialog/address";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";

const GRACHT_TYPED: readonly AddressLine[] = [
  { id: "street", value: "Prinsengracht 267 A" },
  { id: "postalCode", value: "1016GV" },
  { id: "city", value: "Amsterdam" },
  { id: "country", value: "Netherlands" },
];
const GRACHT_SUGGESTED: readonly AddressLine[] = [
  { id: "street", value: "Prinsengracht 267-A" },
  { id: "postalCode", value: "1016 GV" },
  { id: "city", value: "Amsterdam" },
  { id: "country", value: "Netherlands" },
];

const KALVER_TYPED: readonly AddressLine[] = [
  { id: "street", value: "Kalverstrat 92" },
  { id: "postalCode", value: "1012 PH" },
  { id: "city", value: "Amstrdam" },
  { id: "country", value: "Netherlands" },
];
const KALVER_SUGGESTED: readonly AddressLine[] = [
  { id: "street", value: "Kalverstraat 92" },
  { id: "postalCode", value: "1012 PH" },
  { id: "city", value: "Amsterdam" },
  { id: "country", value: "Netherlands" },
];

const FIELD_NAMES: Record<string, string> = { street: "Street and number", postalCode: "Postcode", city: "City" };

/** A caption and the example under it. */
function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function CheckoutForm(): React.JSX.Element {
  const [values, setValues] = useState({ street: "Kalverstrat 92", postalCode: "1012 PH", city: "Amstrdam" });
  const [status, setStatus] = useState("Press Check address: the dialog opens over the form, and Edit address puts focus on the first field that differs.");
  const [open, setOpen] = useState(false);
  const fields = useRef<Record<string, HTMLInputElement | null>>({});

  const entered: readonly AddressLine[] = [
    { id: "street", value: values.street },
    { id: "postalCode", value: values.postalCode },
    { id: "city", value: values.city },
    { id: "country", value: "Netherlands" },
  ];

  // The dialog is for an address that differs from the suggestion. Once the form holds the suggestion there is nothing to confirm.
  const changeOpen = (next: boolean): void => {
    if (next && compareAddresses(entered, KALVER_SUGGESTED).count === 0) {
      setStatus("Address verified: it matches the suggestion, so there is nothing to confirm.");
      return;
    }
    setOpen(next);
  };

  const field = (id: "street" | "postalCode" | "city", className?: string): React.JSX.Element => (
    <div className={`grid gap-1.5 ${className ?? ""}`}>
      <Label htmlFor={`demo-${id}`}>{FIELD_NAMES[id]}</Label>
      <Input
        id={`demo-${id}`}
        ref={(node) => {
          fields.current[id] = node;
        }}
        value={values[id]}
        onChange={(event) => setValues((current) => ({ ...current, [id]: event.target.value }))}
        autoComplete="off"
      />
    </div>
  );

  return (
    <div className="grid gap-5 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs">
      <div className="grid gap-4 sm:grid-cols-2">
        {field("street", "sm:col-span-2")}
        {field("postalCode")}
        {field("city")}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p role="status" className="min-w-0 flex-1 basis-64 text-sm text-pretty text-muted-foreground">
          {status}
        </p>
        <AddressConfirmDialog
          open={open}
          onOpenChange={changeOpen}
          trigger={<Button>Check address</Button>}
          entered={entered}
          suggested={KALVER_SUGGESTED}
          reason="The street name could not be matched"
          allowKeep
          locale="en-GB"
          onUseSuggested={async (address) => {
            await new Promise((resolve) => window.setTimeout(resolve, 700));
            setValues({
              street: address.find((line) => line.id === "street")?.value ?? "",
              postalCode: address.find((line) => line.id === "postalCode")?.value ?? "",
              city: address.find((line) => line.id === "city")?.value ?? "",
            });
            setStatus("Saved: the form now holds the suggested address.");
          }}
          onKeepEntered={() => setStatus("Kept as typed. The order is flagged so the courier is warned.")}
          onEdit={(id) => {
            setStatus(id ? `Back in the form, with focus on ${FIELD_NAMES[id] ?? id}.` : "Back in the form.");
            if (id) fields.current[id]?.focus();
          }}
        />
      </div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-2xl min-w-0 gap-12">
      <Example caption="The house number could not be matched. The suggestion is chosen, the typed address is shown to compare and cannot be kept">
        <AddressConfirmPanel entered={GRACHT_TYPED} suggested={GRACHT_SUGGESTED} reason="The house number could not be matched" locale="en-GB" />
      </Example>

      <Example caption="With allowKeep the typed address is a second choice. Choosing it warns that delivery may fail">
        <AddressConfirmPanel entered={KALVER_TYPED} suggested={KALVER_SUGGESTED} reason="The street name could not be matched" locale="en-GB" allowKeep defaultValue="entered" />
      </Example>

      <Example caption="As a dialog over a checkout form: the buttons report the choice, and Edit address hands focus to the first field that differs">
        <CheckoutForm />
      </Example>
    </div>
  );
}
