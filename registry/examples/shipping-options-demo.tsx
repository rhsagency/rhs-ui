"use client";

import { useState } from "react";

import { IconCalendar, IconHome, IconPin } from "@rhs-ui/icons";
import { ShippingOptions } from "@rhs-ui/commerce/shipping-options";

const OPTIONS = [
  { id: "standard", label: "Standard", eta: "2 to 4 working days", price: { amount: 0, currency: "EUR" }, icon: <IconHome /> },
  { id: "express", label: "Express", eta: "Tomorrow before 18:00", price: { amount: 795, currency: "EUR" }, icon: <IconCalendar /> },
  { id: "pickup", label: "Pick-up point", eta: "From Thursday, 300 m away", price: { amount: 395, currency: "EUR" }, icon: <IconPin /> },
  { id: "evening", label: "Evening delivery", eta: "", price: { amount: 995, currency: "EUR" }, disabled: true },
];

export default function ShippingOptionsDemo() {
  const [value, setValue] = useState("standard");
  return (
    <div className="grid w-full max-w-md gap-3">
      <ShippingOptions options={OPTIONS} value={value} onValueChange={setValue} />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        Chosen: {OPTIONS.find((option) => option.id === value)?.label}
      </p>
    </div>
  );
}
