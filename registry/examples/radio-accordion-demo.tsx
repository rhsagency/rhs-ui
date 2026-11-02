"use client";

import { useState, type ReactNode } from "react";

import { CardFieldset, type CardFieldsetValue } from "@rhs-ui/commerce/card-fieldset";
import { RadioAccordion } from "@rhs-ui/commerce/radio-accordion";
import { IconCreditCard, IconHome, IconLandmark, IconPackage, IconStore } from "@rhs-ui/icons";
import { Label } from "@rhs-ui/primitives/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4">
      <p className="text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function PaymentMethods(): React.JSX.Element {
  const [method, setMethod] = useState("card");
  // A closed panel is not in the page, so what is typed in it lives here and survives switching to another method.
  const [card, setCard] = useState<Partial<CardFieldsetValue>>({});

  return (
    <RadioAccordion
      label="Payment method"
      value={method}
      onValueChange={setMethod}
      options={[
        {
          value: "card",
          label: "Credit or debit card",
          description: "Visa, Mastercard and American Express",
          trailing: "Instant",
          icon: <IconCreditCard />,
          content: <CardFieldset value={card} onChange={(next) => setCard(next)} showName />,
        },
        {
          value: "transfer",
          label: "Bank transfer",
          description: "We keep the order until the money arrives",
          trailing: "1 to 2 days",
          icon: <IconLandmark />,
          content: (
            <div className="grid gap-3 text-sm">
              <p className="text-muted-foreground">Transfer the total to the account below and use your order number as the reference. We ship the day it arrives.</p>
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-1.5">
                <dt className="text-muted-foreground">Account</dt>
                <dd className="font-medium tabular-nums">NL00 RHSD 0123 4567 89</dd>
                <dt className="text-muted-foreground">In the name of</dt>
                <dd className="font-medium">Northwind Trading B.V.</dd>
              </dl>
            </div>
          ),
        },
        {
          value: "store",
          label: "Pay in store",
          description: "Collect your order and pay at the counter",
          trailing: "Free",
          icon: <IconStore />,
        },
      ]}
    />
  );
}

function DeliveryMethods(): React.JSX.Element {
  const [method, setMethod] = useState("store");
  const [store, setStore] = useState("utrecht");

  return (
    <RadioAccordion
      label="Delivery method"
      value={method}
      onValueChange={setMethod}
      options={[
        { value: "home", label: "Home delivery", description: "Tomorrow, before 12:00", trailing: "Free", icon: <IconHome /> },
        { value: "point", label: "Pickup point", description: "Over 2,400 points, from tomorrow", trailing: "€2.50", icon: <IconPackage /> },
        {
          value: "store",
          label: "Collect in store",
          description: "Ready in 2 hours",
          trailing: "Free",
          icon: <IconStore />,
          content: (
            <div className="grid gap-2">
              <Label htmlFor="demo-store">Store</Label>
              <Select value={store} onValueChange={setStore}>
                <SelectTrigger id="demo-store" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utrecht">Utrecht, Oudegracht 112</SelectItem>
                  <SelectItem value="amsterdam">Amsterdam, Haarlemmerstraat 40</SelectItem>
                  <SelectItem value="rotterdam">Rotterdam, Witte de Withstraat 9</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Open every day from 10:00 to 18:00. Bring your order number.</p>
            </div>
          ),
        },
      ]}
    />
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl min-w-0 items-start gap-x-12 gap-y-12 [grid-template-columns:repeat(auto-fit,minmax(min(100%,22rem),1fr))]">
      <Example caption="Pay by card opens the card fields, a bank transfer opens the instructions, and a method with nothing to ask opens nothing.">
        <PaymentMethods />
      </Example>
      <Example caption="One chosen row, one open panel. Arrow keys choose, and the focus stays on the row.">
        <DeliveryMethods />
      </Example>
    </div>
  );
}
