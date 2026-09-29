"use client";

import { useId, useState } from "react";

import { Label } from "@rhs-ui/primitives/label";
import { RadioGroup, RadioGroupItem } from "@rhs-ui/primitives/radio-group";

const OPTIONS = [
  { value: "standard", title: "Standard", detail: "Two to four working days", price: "Free" },
  { value: "express", title: "Express", detail: "Tomorrow, before noon", price: "€9" },
  { value: "pickup", title: "Pick up", detail: "From the studio, any weekday", price: "Free" },
] as const;

export default function Demo(): React.JSX.Element {
  const id = useId();
  const [value, setValue] = useState<string>("standard");

  return (
    <RadioGroup value={value} onValueChange={setValue} aria-label="Delivery" className="w-full max-w-sm gap-2">
      {OPTIONS.map((option) => (
        <Label
          key={option.value}
          htmlFor={`${id}-${option.value}`}
          className="cursor-pointer gap-3 rounded-lg border border-border p-4 font-normal leading-normal transition-colors duration-150 hover:bg-muted/50 has-[[data-state=checked]]:border-foreground"
        >
          <RadioGroupItem value={option.value} id={`${id}-${option.value}`} />
          <span className="grid flex-1 gap-0.5">
            <span className="text-sm font-medium">{option.title}</span>
            <span className="text-xs text-muted-foreground">{option.detail}</span>
          </span>
          <span className="text-sm tabular-nums">{option.price}</span>
        </Label>
      ))}
    </RadioGroup>
  );
}
