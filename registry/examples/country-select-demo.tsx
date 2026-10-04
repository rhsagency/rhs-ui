"use client";

import { useState } from "react";

import { CountrySelect } from "@rhs-ui/primitives/country-select";
import { Label } from "@rhs-ui/primitives/label";

export default function Demo(): React.JSX.Element {
  const [country, setCountry] = useState<string | null>("NL");
  return (
    <div className="mx-auto grid max-w-xs gap-2 p-8">
      <Label htmlFor="country-demo">Country</Label>
      <CountrySelect id="country-demo" name="country" value={country} onValueChange={setCountry} suggested={["NL", "BE", "DE"]} />
      <p className="text-xs text-muted-foreground">Submits: {country ?? "nothing yet"}</p>
    </div>
  );
}
