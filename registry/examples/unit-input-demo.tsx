"use client";

import { useState } from "react";

import { UnitInput } from "@rhs-ui/primitives/unit-input";

export default function Demo(): React.JSX.Element {
  const [value, setValue] = useState("2.4");
  const [unit, setUnit] = useState("kg");
  return (
    <div className="mx-auto grid max-w-xs gap-4 p-8">
      <UnitInput label="Parcel weight" value={value} onValueChange={setValue} unit={unit} onUnitChange={setUnit} units={[{ value: "kg", label: "kg" }, { value: "g", label: "g" }, { value: "lb", label: "lb" }]} />
    </div>
  );
}
