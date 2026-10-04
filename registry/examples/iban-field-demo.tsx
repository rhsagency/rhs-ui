"use client";

import { useState } from "react";

import { IbanField } from "@rhs-ui/primitives/iban-field";

export default function Demo(): React.JSX.Element {
  const [iban, setIban] = useState("NL91ABNA0417164300");
  const [valid, setValid] = useState(true);
  return (
    <div className="mx-auto grid max-w-sm gap-3 p-8">
      <IbanField value={iban} onValueChange={(next, ok) => { setIban(next); setValid(ok); }} name="iban" />
      <p className="text-xs text-muted-foreground">Value: <span className="font-mono">{iban || "empty"}</span>, {valid ? "valid" : "not valid yet"}</p>
    </div>
  );
}
