"use client";

import { useState } from "react";

import { AddressFields, type Address } from "@rhs-ui/primitives/address-fields";

export default function Demo(): React.JSX.Element {
  const [address, setAddress] = useState<Address>({ country: "NL", street: "Oudegracht", number: "210", addition: "", postcode: "3511 NR", city: "Utrecht" });
  return (
    <div className="mx-auto max-w-md p-8">
      <AddressFields legend="Shipping address" value={address} onValueChange={setAddress} />
      <p className="mt-4 text-xs text-muted-foreground">Switch the country to the United Kingdom to see the layout follow it.</p>
    </div>
  );
}
