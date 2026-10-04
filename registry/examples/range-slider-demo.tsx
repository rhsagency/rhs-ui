"use client";

import { useState } from "react";

import { RangeSlider } from "@rhs-ui/primitives/range-slider";

export default function Demo(): React.JSX.Element {
  const [range, setRange] = useState<[number, number]>([40, 180]);
  return (
    <div className="mx-auto max-w-sm p-8">
      <RangeSlider label="Price" value={range} onValueChange={setRange} min={0} max={300} step={5} format={(value) => `€${value}`} />
    </div>
  );
}
