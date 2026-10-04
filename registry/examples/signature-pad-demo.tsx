"use client";

import { useState } from "react";

import { SignaturePad } from "@rhs-ui/primitives/signature-pad";

export default function Demo(): React.JSX.Element {
  const [value, setValue] = useState<string | null>(null);
  return (
    <div className="mx-auto max-w-md p-8">
      <SignaturePad label="Sign the agreement" onValueChange={setValue} />
      <p role="status" className="mt-2 text-xs text-muted-foreground">{value ? "Signed." : "Not signed yet."}</p>
    </div>
  );
}
