"use client";

import { useState, type ReactNode } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { LineItemsTable, type LineItem } from "@rhs-ui/commerce/line-items-table";
import { Label } from "@rhs-ui/primitives/label";
import { Switch } from "@rhs-ui/primitives/switch";

const ORDER: readonly LineItem[] = [
  { id: "jumper", description: "Kestrel merino crew jumper", detail: "Navy, size M", quantity: 2, unitAmount: 8900 },
  { id: "derby", description: "Halcyon leather derby", detail: "Chestnut, EU 43", quantity: 1, unitAmount: 14900 },
  { id: "shirt", description: "Northwind linen shirt", detail: "Sand, size L", quantity: 3, unitAmount: 6500 },
  { id: "wrap", description: "Gift wrapping", detail: "Recycled paper, one card per parcel", quantity: 1, unitAmount: 450 },
];

const DELIVERY = [
  { value: "standard", label: "Standard", amount: 495, name: "Shipping, standard (2 to 3 days)" },
  { value: "express", label: "Express", amount: 995, name: "Shipping, express (next day)" },
  { value: "pickup", label: "Pick-up", amount: 0, name: "Pick up in the Utrecht shop" },
] as const;

const QUOTE: readonly LineItem[] = [
  { id: "audit", description: "Brand and product audit", detail: "Interviews, a review of the live site and a written report", quantity: 8, unit: "h", unitAmount: 9500 },
  { id: "design", description: "Interface design", detail: "Twelve screens in the Kestrel design system", quantity: 24, unit: "h", unitAmount: 11000 },
  { id: "build", description: "Front-end build", detail: "Next.js, tested on phone, tablet and desktop", quantity: 40, unit: "h", unitAmount: 10500 },
  { id: "pm", description: "Project management", detail: "Weekly demo and a shared planning board", quantity: 1, unitAmount: 65000 },
];

const CART: readonly LineItem[] = [
  { id: "mug", description: "Halcyon stoneware mug", detail: "Matt white, 350 ml", quantity: 4, unitAmount: 1850 },
  { id: "pot", description: "Northwind enamel pot", detail: "Slate, 20 cm", quantity: 1, unitAmount: 6495 },
];

/** A caption and the example under it. */
function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 gap-4">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [delivery, setDelivery] = useState<(typeof DELIVERY)[number]["value"]>("standard");
  const [coupon, setCoupon] = useState(true);
  const chosen = DELIVERY.find((option) => option.value === delivery) ?? DELIVERY[0];

  return (
    <div className="mx-auto grid w-full max-w-4xl min-w-0 gap-14 px-4 py-10 sm:px-6">
      <Example caption="An order confirmation. Change the delivery or the code and the rows follow, and the total counts to its new value">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <SegmentedControl label="Delivery" value={delivery} onValueChange={(value) => setDelivery(value as typeof delivery)} options={DELIVERY.map(({ value, label }) => ({ value, label }))} />
          <div className="flex items-center gap-3">
            <Switch id="line-items-coupon" checked={coupon} onCheckedChange={setCoupon} />
            <Label htmlFor="line-items-coupon">Code SPRING10</Label>
          </div>
        </div>
        <LineItemsTable
          title="Order KT-20418"
          lines={ORDER}
          currency="EUR"
          locale="en-GB"
          discount={coupon ? { label: "Discount (SPRING10, 10% off)", percent: 10 } : undefined}
          shipping={{ label: chosen.name, amount: chosen.amount }}
          taxRate={21}
        />
      </Example>

      <Example caption="A quote in hours with the figures written for nl-NL, VAT on top and a fixed discount">
        <LineItemsTable
          headingAs="h3"
          title="Quote Q-2026-0417"
          lines={QUOTE}
          currency="EUR"
          locale="nl-NL"
          discount={{ label: "Early-bird discount", amount: 25000 }}
          taxRate={21}
          labels={{ columns: { description: "Work", quantity: "Hours", unitPrice: "Rate", amount: "Amount" } }}
        />
      </Example>

      <Example caption="A cart review where the prices already include VAT, so the VAT row explains and does not add">
        <LineItemsTable headingAs="h3" title="Your bag" lines={CART} currency="GBP" locale="en-GB" shipping={{ label: "Shipping, standard", amount: 0 }} taxRate={20} taxIncluded />
      </Example>
    </div>
  );
}
