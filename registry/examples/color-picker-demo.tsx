"use client";

import { useState } from "react";

import { ColorPicker } from "@rhs-ui/primitives/color-picker";

export default function Demo(): React.JSX.Element {
  const [brand, setBrand] = useState("#2563eb");
  return (
    <div className="flex flex-col items-center gap-5">
      <ColorPicker label="Brand colour" value={brand} onValueChange={setBrand} />
      <div className="flex items-center gap-3 rounded-xl border border-border p-4">
        <span className="grid size-10 place-items-center rounded-lg text-sm font-semibold text-white" style={{ background: brand }}>
          Aa
        </span>
        <div className="grid gap-1">
          <span className="text-sm font-medium">Button preview</span>
          <span className="rounded-md px-3 py-1 text-xs font-medium text-white" style={{ background: brand }}>
            Get started
          </span>
        </div>
      </div>
    </div>
  );
}
