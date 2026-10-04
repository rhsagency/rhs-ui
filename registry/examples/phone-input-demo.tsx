"use client";

import { useState } from "react";

import { Label } from "@rhs-ui/primitives/label";
import { PhoneInput } from "@rhs-ui/primitives/phone-input";

export default function Demo(): React.JSX.Element {
  const [value, setValue] = useState("");
  return (
    <div className="mx-auto grid max-w-sm gap-2 p-8">
      <Label htmlFor="phone-demo">Phone number</Label>
      <PhoneInput id="phone-demo" value={value} onValueChange={setValue} placeholder="06 12345678" />
      <p className="text-xs text-muted-foreground">Stored as: <span className="font-mono">{value || "nothing yet"}</span></p>
    </div>
  );
}
