"use client";

import { useState } from "react";

import { ColorSwatches } from "@rhs-ui/primitives/color-swatches";

export default function Demo(): React.JSX.Element {
  const [color, setColor] = useState<string | null>("forest");
  return (
    <div className="mx-auto max-w-sm p-8">
      <ColorSwatches
        label="Label colour"
        value={color}
        onValueChange={setColor}
        swatches={[
          { value: "slate", label: "Slate", color: "oklch(0.55 0.02 250)" },
          { value: "forest", label: "Forest green", color: "oklch(0.55 0.12 150)" },
          { value: "ocean", label: "Ocean blue", color: "oklch(0.58 0.14 240)" },
          { value: "plum", label: "Plum", color: "oklch(0.5 0.15 320)" },
          { value: "rust", label: "Rust", color: "oklch(0.58 0.16 40)" },
          { value: "sand", label: "Sand", color: "oklch(0.85 0.05 85)" },
          { value: "snow", label: "Snow", color: "oklch(0.98 0 0)" },
        ]}
      />
    </div>
  );
}
